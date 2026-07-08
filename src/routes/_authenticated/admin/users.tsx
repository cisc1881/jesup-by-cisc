import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role); rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  });
  const rows = (data ?? []).filter((r) => !q || (r.email ?? "").toLowerCase().includes(q.toLowerCase()) || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()));

  async function grantAdmin(uid: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Admin granted"); qc.invalidateQueries({ queryKey: ["admin-users"] });
  }
  async function revokeAdmin(uid: string) {
    if (uid === user?.id && !confirm("Remove your own admin access?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    if (error) return toast.error(error.message);
    toast.success("Admin revoked"); qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Users" searchValue={q} onSearchChange={setQ}
        onExport={() => downloadCsv("users", rows, [
          { header: "Name", get: (r) => r.full_name }, { header: "Email", get: (r) => r.email },
          { header: "Roles", get: (r) => r.roles.join(", ") }, { header: "Joined", get: (r) => r.created_at },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead>Joined</TableHead><TableHead className="w-40"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No users.</TableCell></TableRow>}
            {rows.map((r) => {
              const isAdmin = r.roles.includes("admin");
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell><div className="flex gap-1">{r.roles.map((role: string) => <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>)}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Button size="sm" variant="outline" onClick={() => revokeAdmin(r.id)}>Revoke admin</Button>
                    ) : (
                      <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => grantAdmin(r.id)}>Grant admin</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </AdminShell>
  );
}
