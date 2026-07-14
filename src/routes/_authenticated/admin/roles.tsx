import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/roles")({ component: AdminRoles });

function AdminRoles() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["admin-roles-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role, user_id");
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.role, (counts.get(row.role) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => a.role.localeCompare(b.role));
    },
  });

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Roles"
        description="Overview of user roles across the platform. Grant or revoke admin access from Users."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Loading roles…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No roles assigned yet.
                  </TableCell>
                </TableRow>
              )}
              {roles.map((row) => (
                <TableRow key={row.role}>
                  <TableCell>
                    <Badge variant={row.role === "admin" ? "default" : "secondary"}>{row.role}</Badge>
                  </TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin/users">Manage users</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </CommandCenterContentShell>
  );
}
