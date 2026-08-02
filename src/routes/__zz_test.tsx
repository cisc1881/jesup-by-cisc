import { fetchEvents } from "@/lib/events";
async function f(){
  const events = await fetchEvents({ upcomingOnly: false });
  console.log(events.length);
}
