import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { downloadCsv } from "@/lib/csv";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { toast } from "sonner";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { generateGrantDraftServerFn } from "@/modules/ai/grant-assistant-server-fn";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/grants")({ component: AdminGrants });

const empty = { title: "", funder: "", description: "", amount: "", deadline: "", url: "" };
type GrantRow = Database["public"]["Tables"]["grants"]["Row"];
type GrantInsert = Database["public"]["Tables"]["grants"]["Insert"];
type GrantForm = typeof empty;

function AdminGrants() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GrantRow | null>(null);
  const [form, setForm] = useState<GrantForm>(empty);
  const [sourceNotes, setSourceNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-grants"],
    queryFn: async () =>
      (
        await supabase
          .from("grants")
          .select("*")
          .order("deadline", { ascending: true, nullsFirst: false })
      ).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  function openNew() {
    setEditing(null);
    setForm(empty);
    setSourceNotes("");
    setOpen(true);
  }
  function openEdit(r: GrantRow) {
    setEditing(r);
    setForm({ ...empty, ...r, deadline: r.deadline ?? "" });
    setSourceNotes("");
    setOpen(true);
  }

  async function generateDraft() {
    setIsGenerating(true);
    try {
      const draft = await generateGrantDraftServerFn({ data: { sourceNotes } });
      setForm((current) => ({ ...current, ...draft }));
      toast.success("Grant draft created. Review every field before saving.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Grant draft generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: GrantInsert = { ...form, deadline: form.deadline || null };
    const res = editing
      ? await supabase.from("grants").update(payload).eq("id", editing.id)
      : await supabase.from("grants").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-grants"] });
  }
  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "grant",
      itemName: title,
      onDelete: async () => {
        const { error } = await supabase.from("grants").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-grants"] }),
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Grants"
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("grants", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Funder", get: (r) => r.funder },
            { header: "Amount", get: (r) => r.amount },
            { header: "Deadline", get: (r) => r.deadline },
          ])
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Funder</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    None yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.funder}</TableCell>
                  <TableCell>{fmtDate(r.deadline)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del(r.id, r.title)}
                        aria-label={`Delete ${r.title}`}
                      >
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} grant</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div>
                <Label htmlFor="grant-source-notes">Official source notes</Label>
                <p className="text-xs text-muted-foreground">
                  Paste funder language or verified notes. AI creates an editable draft and never
                  saves automatically.
                </p>
              </div>
              <Textarea
                id="grant-source-notes"
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                placeholder="Paste at least 40 characters from the official funding announcement…"
                rows={5}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={sourceNotes.trim().length < 40 || isGenerating}
                onClick={generateDraft}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Creating draft…" : "Draft fields with AI"}
              </Button>
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Funder</Label>
              <Input
                value={form.funder ?? ""}
                onChange={(e) => setForm({ ...form, funder: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                value={form.amount ?? ""}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. Up to $25,000"
              />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline ?? ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label>Application URL</Label>
              <Input
                value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </AdminShell>
  );
}
