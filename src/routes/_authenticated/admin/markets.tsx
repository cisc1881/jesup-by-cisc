import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { MarketFormDialog } from "@/components/admin/market-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadCsv } from "@/lib/csv";
import { deleteMarket, fetchAdminMarkets, getMarketAnalytics } from "@/lib/markets";
import { toast } from "sonner";
import { BarChart3, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/markets")({ component: AdminMarkets });

function AdminMarkets() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const { data } = useQuery({ queryKey: ["admin-markets"], queryFn: fetchAdminMarkets });
  const rows = (data ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  const { data: analytics } = useQuery({
    queryKey: ["market-analytics"],
    enabled: analyticsOpen,
    queryFn: getMarketAnalytics,
  });

  function openNew() {
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  async function del(id: string) {
    if (!confirm("Delete this market and all vendors, products, and photos?")) return;
    try {
      await deleteMarket(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-markets"] });
      qc.invalidateQueries({ queryKey: ["markets"] });
      qc.invalidateQueries({ queryKey: ["home-page"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function handleSaved() {
    qc.invalidateQueries({ queryKey: ["admin-markets"] });
    qc.invalidateQueries({ queryKey: ["markets"] });
    qc.invalidateQueries({ queryKey: ["home-page"] });
  }

  return (
    <AdminShell>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setAnalyticsOpen(true)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </div>
      <AdminPageHeader
        title="Farmers Markets"
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("markets", rows, [
            { header: "Name", get: (r) => r.name },
            { header: "City", get: (r) => r.city },
            { header: "State", get: (r) => r.state },
            { header: "Hours", get: (r) => r.hours },
            { header: "Season", get: (r) => r.season },
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
                  <TableCell className="font-medium">
                    {r.name}
                    {r.isFeatured && (
                      <Badge variant="secondary" className="ml-2">
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[r.city, r.state].filter(Boolean).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "outline"}>{r.isActive ? "Active" : "Draft"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
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

      <MarketFormDialog open={open} onOpenChange={setOpen} marketId={editingId} onSaved={handleSaved} />

      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Market analytics</DialogTitle>
          </DialogHeader>
          {analytics ? (
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Active markets</dt>
                <dd className="text-2xl font-bold">{analytics.activeMarkets}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Active vendors</dt>
                <dd className="text-2xl font-bold">{analytics.activeVendors}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Products listed</dt>
                <dd className="text-2xl font-bold">{analytics.products}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">User favorites</dt>
                <dd className="text-2xl font-bold">{analytics.favorites}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
