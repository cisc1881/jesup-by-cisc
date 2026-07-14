import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/podcast")({
  beforeLoad: () => {
    throw redirect({ to: "/podcasts" });
  },
});
