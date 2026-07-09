import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { MarketFormDialog } from "@/components/admin/market-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deleteMarket, fetchAdminMarkets } from "@/lib/markets";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/markets")({ component: AdminMarkets });

function AdminMarkets() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-markets"],
    queryFn: fetchAdminMarkets,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.city ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  function openNew() {
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-markets"] });
    qc.invalidateQueries({ queryKey: ["markets"] });
    qc.invalidateQueries({ queryKey: ["home-page"] });
  }

  async function del(id: string, name: string) {
    await confirmAndDelete({
      entityLabel: "market",
      itemName: name,
      description: `"${name}" and all vendors, products, and photos will be permanently removed.`,
      onDelete: () => deleteMarket(id),
      onSuccess: invalidateAll,
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Farmers Markets"
        description="Manage market listings, vendors, hours, and gallery images."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("markets", rows, [
            { header: "Name", get: (r) => r.name },
            { header: "City", get: (r) => r.city },
            { header: "State", get: (r) => r.state },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
            { header: "Active", get: (r) => (r.isActive ? "Yes" : "No") },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No markets yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={r.isActive ? "default" : "secondary"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {r.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r.id)} aria-label={`Edit ${r.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id, r.name)} aria-label={`Delete ${r.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MarketFormDialog open={open} onOpenChange={setOpen} marketId={editingId} onSaved={invalidateAll} />
      {dialog}
    </AdminShell>
  );
}
