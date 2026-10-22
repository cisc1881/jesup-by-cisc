import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { CalendarPlus, ArrowLeft, Ticket, Settings2 } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fetchUserEventRegistration, type EventDetail } from "@/lib/events";
import { visibleConferenceSections, safeEventUrl, type ConferenceSection } from "@/lib/conference";
import { claimEventbriteTicket, fetchMyEventWallet } from "@/lib/conference-data";
import { downloadEventIcs } from "@/lib/event-calendar";
import { ConferenceHero } from "./conference-hero";
import { EventAgenda, EventSpeakers, EventRelatedSections } from "./event-detail-sections";
import { EventRegistrationPanel } from "./event-registration-panel";
import { EventChatRoom } from "./event-chat-room";
import { EventMapView } from "./event-map-view";
import { toast } from "sonner";

export function ConferenceShell({ event }: { event: EventDetail }) {
  const [selected, setSelected] = useState<ConferenceSection>("home");
  const [claiming, setClaiming] = useState(false);
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const sections = visibleConferenceSections(event);
  const tab = sections.some(([id]) => id === selected) ? selected : "home";
  const { data: registration } = useQuery({
    queryKey: ["event-reg", event.id, user?.id], enabled: Boolean(user),
    queryFn: () => user ? fetchUserEventRegistration(event.id, user.id) : Promise.resolve(null),
  });
  const { data: wallet = [], error: walletError } = useQuery({
    queryKey: ["event-wallet", event.id, registration?.id], enabled: tab === "wallet" && Boolean(registration),
    queryFn: () => registration ? fetchMyEventWallet(event.id, registration.id) : Promise.resolve([]),
  });
  async function claim() {
    setClaiming(true);
    try { await claimEventbriteTicket(event.id); await qc.invalidateQueries({ queryKey: ["event-reg", event.id] }); toast.success("Eventbrite ticket linked to your account"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not claim ticket"); }
    finally { setClaiming(false); }
  }
  const signIn = <Button asChild variant="outline"><Link to="/auth" search={{ next: `/events/${event.slug}` }}>Sign in to your event</Link></Button>;
  return <PublicLayout>
    <PageContainer size="lg" className="pb-bottom-nav">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/events" search={{ view:"explore" }}><ArrowLeft className="size-4" />All events</Link></Button>
        {isAdmin && <Button variant="outline" size="sm" asChild><Link to="/admin/events"><Settings2 className="size-4" />Manage conference</Link></Button>}
      </div>
      <div className="conference-shell" data-event-theme={event.metadata.theme_preset === "tuskegee" ? "tuskegee" : "network"}>
        <ConferenceHero event={event} />
        <nav className="flex overflow-x-auto border-b bg-card" aria-label="Conference sections">{sections.map(([id,label]) => <Button key={id} type="button" variant="ghost" aria-current={tab === id ? "page" : undefined} className={`min-h-14 shrink-0 border-b-2 px-5 ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`} onClick={() => setSelected(id)}>{label}</Button>)}</nav>
        <div className="py-8 sm:py-10">
          {tab === "home" && <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_280px]">
            <section className="space-y-4"><p className="text-sm font-semibold text-primary">February 18–19, 2027</p><h2 className="text-2xl font-bold">A legacy that keeps growing.</h2><p className="max-w-2xl leading-relaxed text-muted-foreground">135th Annual Farmers Conference<br />Tuskegee University Historic Campus</p><p className="max-w-2xl leading-relaxed text-muted-foreground">Conference schedule, speakers, registration, and campus information will be shared when confirmed.</p><Button variant="outline" onClick={() => downloadEventIcs(event)}><CalendarPlus className="size-4" />Save the dates</Button></section>
            <aside className="space-y-4 border-t pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><Ticket className="size-6 text-primary" /><h2 className="text-lg font-bold">Registration updates</h2><p className="text-sm leading-relaxed text-muted-foreground">{event.registrationOpen ? "Registration is available in Tickets." : "Registration details are not yet announced."}</p>{sections.some(([id]) => id === "tickets") && <Button variant="outline" onClick={() => setSelected("tickets")}>Tickets</Button>}</aside>
          </div>}
          {tab === "schedule" && <EventAgenda event={event} />}
          {tab === "speakers" && <EventSpeakers event={event} />}
          {tab === "tickets" && <div className="max-w-2xl"><EventRegistrationPanel event={event} registration={registration} />{event.metadata.registration_provider === "eventbrite" && !registration && <div className="mt-6">{user ? <Button disabled={claiming} onClick={() => void claim()}>{claiming ? "Linking…" : "Claim my imported Eventbrite ticket"}</Button> : signIn}</div>}</div>}
          {tab === "sponsors" && <EventRelatedSections event={{ ...event, programs:[],publications:[],podcasts:[],partners:[] }} />}
          {tab === "resources" && <EventRelatedSections event={{ ...event, programs:[],partners:[],sponsors:[] }} />}
          {tab === "map" && <div className="space-y-5"><h2 className="text-2xl font-bold">Map & Parking</h2>{event.lat != null && event.lng != null && <EventMapView events={[event]} />}{[["Campus map",event.metadata.map_url],["Parking information",event.metadata.parking_url]].map(([label,url]) => safeEventUrl(url) && <Button key={String(label)} variant="outline" asChild><a href={safeEventUrl(url)} target="_blank" rel="noreferrer">{String(label)}</a></Button>)}</div>}
          {tab === "community" && <EventChatRoom eventId={event.id} registered={registration?.status === "registered"} />}
          {tab === "my-event" && <section className="space-y-5"><h2 className="text-2xl font-bold">My Event</h2>{!user ? signIn : registration ? <><p className="text-muted-foreground">Registration: {registration.status.replaceAll("_"," ")}</p><EventRegistrationPanel event={event} registration={registration} /></> : <p className="text-muted-foreground">No registration is linked to your account yet.</p>}</section>}
          {tab === "wallet" && <section className="space-y-5"><h2 className="text-2xl font-bold">Wallet</h2>{!user ? signIn : !registration ? <p className="text-muted-foreground">No registration is linked to your account yet.</p> : <><p className="text-sm text-muted-foreground">{registration.status === "registered" ? "Your event credentials" : "Registration is not active."}</p>{registration.ticket_code && registration.status === "registered" && <div className="credential-qr w-fit border p-5"><QRCodeSVG value={registration.ticket_code} size={200} /><p className="mt-3 text-sm font-semibold">Event admission</p></div>}{walletError && <p role="alert">Your issued credentials could not be loaded.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{wallet.map(item => <article key={item.id} className="border bg-card p-5"><h3 className="font-bold">{item.event_products?.name}</h3><p className="mt-2 text-sm text-muted-foreground">{item.beneficiary_name ?? "Self"} · {item.status} · {Math.max(0,item.quantity-item.event_entitlement_redemptions.length)} remaining</p>{item.status === "active" && <div className="credential-qr mt-4 w-fit p-3"><QRCodeSVG value={item.credential_code} size={160} /></div>}</article>)}</div>{wallet.length === 0 && <p className="text-muted-foreground">No meal, activity, parking, or package credentials have been issued.</p>}</>}</section>}
        </div>
      </div>
    </PageContainer>
  </PublicLayout>;
}