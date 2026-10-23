import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, ArrowLeft, Ticket, Settings2 } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fetchUserEventRegistration, type EventDetail } from "@/lib/events";
import { conferenceResourceLinks, eventDateLabel, visibleConferenceSections, safeEventUrl, type ConferenceSection } from "@/lib/conference";
import { downloadEventIcs } from "@/lib/event-calendar";
import { ConferenceHero } from "./conference-hero";
import { NextSessionCountdown } from "./next-session-countdown";
import { EventAgenda, EventSpeakers, EventRelatedSections } from "./event-detail-sections";
import { EventRegistrationPanel } from "./event-registration-panel";
import { EventChatRoom } from "./event-chat-room";
import { EventMapView } from "./event-map-view";
import { ConferenceWallet } from "./conference-wallet";
import { ConferenceCatalog, conferenceCatalogQuery } from "./conference-catalog";
import { useServerFn } from "@tanstack/react-start";
import { conferenceWorkspace } from "@/lib/conference-operations.functions";

export function ConferenceShell({ event }: { event: EventDetail }) {
  const [selected, setSelected] = useState<ConferenceSection>("home");
  const { user, isAdmin } = useAuth();
  const readWorkspace = useServerFn(conferenceWorkspace);
  const { data: workspace } = useQuery({queryKey:["conference-staff-access",event.id,user?.id],enabled:Boolean(user)&&event.metadata.staff_operations_enabled===true,queryFn:()=>readWorkspace({data:{eventId:event.id,wallet:true}})});
  const { data: products } = useQuery({...conferenceCatalogQuery(event.id), enabled: event.metadata.catalog_enabled === true});
  const sections = visibleConferenceSections(event, products?.length ?? 0);
  const tab = sections.some(([id]) => id === selected) ? selected : "home";
  const { data: registration } = useQuery({
    queryKey: ["event-reg", event.id, user?.id], enabled: Boolean(user),
    queryFn: () => user ? fetchUserEventRegistration(event.id, user.id) : Promise.resolve(null),
  });
  const signIn = <Button asChild variant="outline"><Link to="/auth" search={{ next: `/events/${event.slug}` }}>Sign in to your event</Link></Button>;
  return <PublicLayout>
    <PageContainer size="lg" className="pb-bottom-nav">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/events" search={{ view:"explore" }}><ArrowLeft className="size-4" />All events</Link></Button>
        {isAdmin && <div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link to="/admin/events"><Settings2 className="size-4" />Manage conference</Link></Button></div>}
        {workspace?.permissions.some(p=>p.allowed) && <Button variant="outline" asChild><Link to="/events/$id/scan" params={{id:event.id}}>Staff scanner</Link></Button>}
      </div>
      <div className="conference-shell">
        <ConferenceHero event={event} />
        <nav className="flex overflow-x-auto border-b bg-card" aria-label="Conference sections">{sections.map(([id,label]) => <Button key={id} type="button" variant="ghost" aria-current={tab === id ? "page" : undefined} className={`min-h-14 shrink-0 border-b-2 px-5 ${tab === id ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "border-transparent text-muted-foreground"}`} onClick={() => setSelected(id)}>{label}</Button>)}</nav>
        <div className="py-8 sm:py-10">
          {tab === "home" && <div className="space-y-6">
          <NextSessionCountdown event={event} />
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_280px]">
            <section className="space-y-4"><p className="text-sm font-semibold text-primary">{eventDateLabel(event)}</p><h2 className="text-2xl font-bold">{event.title}</h2><p className="max-w-2xl leading-relaxed text-muted-foreground">{event.location}</p>{event.description && <p className="max-w-2xl leading-relaxed text-muted-foreground">{event.description}</p>}<Button variant="outline" onClick={() => downloadEventIcs(event)}><CalendarPlus className="size-4" />Save the dates</Button></section>
            <aside className="space-y-4 border-t pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><Ticket className="size-6 text-primary" /><h2 className="text-lg font-bold">Registration updates</h2><p className="text-sm leading-relaxed text-muted-foreground">{event.registrationOpen ? "Registration is available in Tickets." : "Registration details are not yet announced."}</p>{sections.some(([id]) => id === "tickets") && <Button variant="outline" onClick={() => setSelected("tickets")}>Tickets</Button>}</aside>
          </div>}
          {tab === "schedule" && <EventAgenda event={event} />}
          {tab === "speakers" && <EventSpeakers event={event} />}
          {tab === "tickets" && <div className="space-y-6">{event.metadata.catalog_enabled===true && <ConferenceCatalog eventId={event.id}/>}<div className="max-w-2xl"><EventRegistrationPanel event={event} registration={registration} /></div></div>}
          {tab === "sponsors" && <EventRelatedSections event={{ ...event, programs:[],publications:[],podcasts:[],partners:[] }} />}
          {tab === "resources" && <div className="space-y-6"><EventRelatedSections event={{ ...event, programs:[],partners:[],sponsors:[] }} /><div className="divide-y">{conferenceResourceLinks(event.metadata).map((link,index) => <div key={`${link.url}-${index}`} className="py-3"><Button variant="outline" asChild><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></Button></div>)}</div></div>}
          {tab === "map" && <div className="space-y-5"><h2 className="text-2xl font-bold">Map & Parking</h2>{event.lat != null && event.lng != null && <EventMapView events={[event]} />}{[["Campus map",event.metadata.map_url],["Parking information",event.metadata.parking_url]].map(([label,url]) => safeEventUrl(url) && <Button key={String(label)} variant="outline" asChild><a href={safeEventUrl(url)} target="_blank" rel="noreferrer">{String(label)}</a></Button>)}</div>}
          {tab === "community" && <EventChatRoom eventId={event.id} registered={registration?.status === "registered"} />}
          {tab === "my-event" && <section className="space-y-5"><h2 className="text-2xl font-bold">My Event</h2>{!user ? signIn : registration ? <><p className="text-muted-foreground">Registration: {registration.status.replaceAll("_"," ")}</p><EventRegistrationPanel event={event} registration={registration} /></> : <p className="text-muted-foreground">No registration is linked to your account yet.</p>}</section>}
          {tab === "wallet" && (!user ? signIn : <ConferenceWallet eventId={event.id} claimEnabled={event.metadata.eventbrite_claim_enabled === true} />)}
        </div>
      </div>
    </PageContainer>
  </PublicLayout>;
}