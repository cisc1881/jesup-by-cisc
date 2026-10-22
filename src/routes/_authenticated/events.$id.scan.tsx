import {createFileRoute,Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {useState} from 'react';
import {PublicLayout} from '@/components/public-layout';
import {PageContainer} from '@/components/design-system';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {QrTicketScanner} from '@/components/admin/qr-ticket-scanner';
import {conferenceWorkspace,operateConferenceCredential} from '@/lib/conference-operations.functions';
import {printEventBadge} from '@/lib/badge-printing';
import {buildPageHead} from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/events/scan')({head:()=>buildPageHead({title:'Event staff scanner · JESUP',description:'Authorized event admission, entitlement redemption and badge issuance.'}),component:StaffScanner});
function StaffScanner(){
 const {id}=Route.useParams(),read=useServerFn(conferenceWorkspace),operate=useServerFn(operateConferenceCredential);
 const query=useQuery({queryKey:['staff-workspace',id],queryFn:()=>read({data:{eventId:id}})});
 const [operation,setOperation]=useState<'checkin'|'redemption'|'badge'|'meal'>('checkin'),[code,setCode]=useState(''),[meal,setMeal]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const allowed=query.data?.permissions.filter(p=>p.allowed).map(p=>p.operation)??[];
 const selected=allowed.includes(operation==='meal'?'redemption':operation)?operation:allowed[0];
 async function scan(value:string){if(!selected||busy)return;setBusy(true);setMessage('');try{
  const result=await operate({data:{eventId:id,operation:selected as typeof operation,code:value,requestId:crypto.randomUUID(),mealDayId:operation==='meal'?meal||null:null}});
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Invalid scanner result');
  const r=result as Record<string,unknown>;
  if(selected==='badge'){printEventBadge({attendeeName:String(r.attendee_name??'Attendee'),eventTitle:'JESUP event',ticketCode:String(r.ticket_code??'')});setMessage('Badge issuance recorded; print dialog requested.')}
  else if(selected==='checkin')setMessage(`${String(r.attendee_name??'Attendee')} · ${r.already_checked_in?'Already checked in':'Checked in'}`);
  else setMessage(`Redeemed · ${String(r.remaining??0)} remaining`);
  setCode('');
 }catch(e){setMessage(e instanceof Error?e.message:'Could not process credential')}finally{setBusy(false)}}
 return <PublicLayout><PageContainer size="md" className="space-y-6 py-8"><Button variant="ghost" asChild><Link to="/events">All events</Link></Button><h1 className="text-3xl font-bold">Event staff scanner</h1>{query.isPending?<p role="status">Checking event permissions…</p>:query.error?<p role="alert">{query.error.message}</p>:!allowed.length?<p role="alert">Event staff permission required. Operations must be enabled by an administrator.</p>:<><Select value={selected} onValueChange={v=>setOperation(v as typeof operation)}><SelectTrigger aria-label="Scanner operation"><SelectValue/></SelectTrigger><SelectContent>{allowed.map(p=><SelectItem key={p} value={p}>{p==='checkin'?'Admission check-in':p==='badge'?'Badge print':'Credential redemption'}</SelectItem>)}{allowed.includes('redemption')&&Boolean(query.data?.meals.length)&&<SelectItem value="meal">Legacy meal redemption</SelectItem>}</SelectContent></Select>{operation==='meal'&&<Select value={meal} onValueChange={setMeal}><SelectTrigger aria-label="Meal service"><SelectValue placeholder="Meal service"/></SelectTrigger><SelectContent>{query.data?.meals.map(m=><SelectItem key={m.id} value={m.id}>{m.label} · {m.service_date}</SelectItem>)}</SelectContent></Select>}<QrTicketScanner disabled={busy} onDetected={scan}/><Label>Credential code<Input aria-label="Credential code" value={code} onChange={e=>setCode(e.target.value)} autoComplete="off"/></Label><Button disabled={busy||code.trim().length<6} onClick={()=>void scan(code)}>Process credential</Button><p role="status" className="font-semibold">{message}</p></>}</PageContainer></PublicLayout>;
}
