import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {QRCodeSVG} from 'qrcode.react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {conferenceWorkspace,claimConferenceRegistration} from '@/lib/conference-operations.functions';
export function ConferenceWallet({eventId,claimEnabled}:{eventId:string;claimEnabled:boolean}){
 const read=useServerFn(conferenceWorkspace),claim=useServerFn(claimConferenceRegistration),qc=useQueryClient();
 const query=useQuery({queryKey:['conference-wallet',eventId],queryFn:()=>read({data:{eventId,wallet:true}})});
 const [code,setCode]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function link(){setBusy(true);setMessage('');try{await claim({data:{eventId,credential:code}});setCode('');await qc.invalidateQueries();setMessage('Eventbrite registration linked')}catch(e){setMessage(e instanceof Error?e.message:'Could not link ticket')}finally{setBusy(false)}}
 if(query.isPending)return <p role="status">Loading credentials…</p>;
 if(query.error)return <p role="alert">{query.error.message}</p>;
 const data=query.data;
 const registration=data?.registrations.find(r=>r.status==='registered');
 return <section className="space-y-6"><h2 className="text-2xl font-bold">Wallet</h2>{!registration&&claimEnabled&&<div className="max-w-md space-y-3"><Label>Original Eventbrite barcode<Input aria-label="Original Eventbrite barcode" value={code} onChange={e=>setCode(e.target.value)} autoComplete="off"/></Label><Button disabled={busy||code.trim().length<6} onClick={()=>void link()}>Link Eventbrite ticket</Button><p role="status" className="text-sm">{message}</p></div>}{registration?.ticket_code&&<article className="w-fit space-y-3 rounded-lg border bg-card p-5"><h3 className="font-bold">Event admission</h3>{registration.eventbrite_ticket_class&&<p className="text-sm text-muted-foreground">{registration.eventbrite_ticket_class}</p>}<div className="credential-qr w-fit p-3"><QRCodeSVG value={registration.ticket_code} size={180}/></div></article>}{!data?.entitlements.length&&<p className="text-muted-foreground">No issued credentials.</p>}<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data?.entitlements.map(e=><article key={e.id} className="space-y-3 rounded-lg border bg-card p-5"><h3 className="font-bold">{e.event_products?.name||'Event credential'}</h3>{e.beneficiary_name?<p>{e.beneficiary_name}</p>:e.event_products?.beneficiary==='guest'&&<p>Guest</p>}<p className="text-sm text-muted-foreground">{e.status} · {e.event_entitlement_redemptions.length}/{e.quantity} used</p>{e.status==='active'&&e.event_entitlement_redemptions.length<e.quantity&&registration&&<div className="credential-qr w-fit p-3"><QRCodeSVG value={e.credential_code} size={180}/></div>}</article>)}</div></section>;
}
