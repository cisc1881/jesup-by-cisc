import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/funder")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth", search: { next: "/funder" } });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .eq("role", "funder")
      .maybeSingle();
    if (!role) throw redirect({ to: "/unauthorized" });
  },
  component: () => <Outlet />,
});
