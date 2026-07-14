import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/podcast")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/podcasts" });
  },
});
