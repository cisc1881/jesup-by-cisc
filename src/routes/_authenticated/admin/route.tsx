import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { LayoutDashboard, MapPin, Calendar, BookOpen, DollarSign, Briefcase, Package, ClipboardList, Users, LogOut, ExternalLink, Mic, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: location.href } });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/unauthorized" });
  },
  component: AdminShell,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/markets", label: "Markets", icon: MapPin },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/publications", label: "Publications", icon: BookOpen },
  { to: "/admin/grants", label: "Grants", icon: DollarSign },
  { to: "/admin/internships", label: "Internships", icon: Briefcase },
  { to: "/admin/equipment", label: "Equipment", icon: Package },
  { to: "/admin/podcast", label: "Podcast", icon: Mic },
  { to: "/admin/partners", label: "Partners", icon: Building2 },
  { to: "/admin/surveys", label: "Surveys", icon: ClipboardList },
  { to: "/admin/users", label: "Users", icon: Users },
];

function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/admin" className="flex items-center gap-2 px-2 py-1">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md grad-crimson text-white font-black">C</span>
              <span className="font-black tracking-tight text-sm text-foreground group-data-[collapsible=icon]:hidden">JESUP Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((it) => {
                    const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                    return (
                      <SidebarMenuItem key={it.to}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={it.to}><it.icon className="h-4 w-4" /><span>{it.label}</span></Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild><Link to="/"><ExternalLink className="h-4 w-4" /><span>View public site</span></Link></SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
                  <LogOut className="h-4 w-4" /><span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="font-black tracking-tight text-sm text-foreground">JESUP · Admin</div>
            <div className="ml-auto"><Button asChild variant="outline" size="sm"><Link to="/">Public site</Link></Button></div>
          </header>
          <main className="flex-1 bg-secondary/30 p-4 sm:p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
