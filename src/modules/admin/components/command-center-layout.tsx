import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  COMMAND_CENTER_NAV,
  COMMAND_CENTER_NAV_GROUPS,
  COMMAND_CENTER_TITLE,
} from "../config/nav-items";

export function CommandCenterLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/admin" className="flex items-center gap-2 px-2 py-1">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md grad-crimson text-white font-black">
                J
              </span>
              <span className="font-black tracking-tight text-sm text-foreground group-data-[collapsible=icon]:hidden">
                {COMMAND_CENTER_TITLE}
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            {COMMAND_CENTER_NAV_GROUPS.map((group) => {
              const items = COMMAND_CENTER_NAV.filter((item) => item.group === group.id);
              if (items.length === 0) return null;
              return (
                <SidebarGroup key={group.id}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                        return (
                          <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton asChild isActive={active}>
                              <Link to={item.to}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <ExternalLink className="h-4 w-4" />
                    <span>View public site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="font-black tracking-tight text-sm text-foreground">{COMMAND_CENTER_TITLE}</div>
            <div className="ml-auto">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Public site</Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 bg-secondary/30 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
