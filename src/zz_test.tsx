import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/events";

function Test() {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents({ upcomingOnly: false }),
  });
  return <div>{events?.length}</div>;
}
