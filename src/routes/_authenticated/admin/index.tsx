import { createFileRoute } from "@tanstack/react-router";
import { CommandCenterDashboard } from "@/modules/admin";

export const Route = createFileRoute("/_authenticated/admin/")({ component: CommandCenterHome });

function CommandCenterHome() {
  return <CommandCenterDashboard />;
}
