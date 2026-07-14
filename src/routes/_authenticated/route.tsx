import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { nextPathFromLocation } from "@/lib/auth-redirect";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: nextPathFromLocation(location) } });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
