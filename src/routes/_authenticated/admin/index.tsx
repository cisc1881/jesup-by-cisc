import { createFileRoute } from "@tanstack/react-router";
import { CommandCenterDashboard } from "@/modules/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [
    { title: "JESUP Command Center · Administration" },
    { name: "description", content: "Manage JESUP programs, events, markets and network content." },
    { property: "og:title", content: "JESUP Command Center · Administration" },
    { property: "og:description", content: "Manage JESUP programs, events, markets and network content." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: CommandCenterHome });

function CommandCenterHome() {
  return <CommandCenterDashboard />;
}
