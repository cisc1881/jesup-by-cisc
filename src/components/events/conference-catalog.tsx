import {useQuery} from '@tanstack/react-query';
import {getPublicConferenceCatalog} from '@/lib/public-events.functions';
import {Button} from '@/components/ui/button';
export const conferenceCatalogQuery = (eventId:string) => ({queryKey:['public-conference-catalog',eventId],queryFn:()=>getPublicConferenceCatalog({data:{eventId}})});
export function ConferenceCatalog({eventId}:{eventId:string}){
 const query=useQuery(conferenceCatalogQuery(eventId));
 return <section className="space-y-4"><h2 className="text-2xl font-bold">Event products</h2>{query.error&&<p role="alert">Catalog unavailable.</p>}<div className="divide-y">{query.data?.map(p=><article key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="font-bold">{p.name}</h3><p className="text-sm text-muted-foreground">{p.kind.replaceAll('_',' ')} · {p.beneficiary}</p>{p.description&&<p>{p.description}</p>}</div><div className="space-y-2"><p>{p.price_cents===null?'Price not announced':new Intl.NumberFormat('en-US',{style:'currency',currency:p.currency}).format(p.price_cents/100)}</p><Button disabled variant="outline">Checkout unavailable</Button></div></article>)}</div></section>;
}
