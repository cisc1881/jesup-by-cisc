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
import { SurveySummaryDialog } from "@/components/admin/survey-summary-dialog";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/surveys")({ component: AdminSurveys });

type SurveyRow = Database["public"]["Tables"]["surveys"]["Row"];
type SurveyForm = Pick<SurveyRow, "title" | "description" | "qualtrics_url">;

const empty: SurveyForm = { title: "", description: "", qualtrics_url: "" };

function AdminSurveys() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SurveyRow | null>(null);
  const [form, setForm] = useState<SurveyForm>(empty);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-surveys"],
    queryFn: async () =>
      (await supabase.from("surveys").select("*").order("created_at", { ascending: false })).data ??
      [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(row: SurveyRow) {
    setEditing(row);
    setForm({
      title: row.title,
      description: row.description,
      qualtrics_url: row.qualtrics_url,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = editing
      ? await supabase.from("surveys").update(form).eq("id", editing.id)
      : await supabase.from("surveys").insert(form);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-surveys"] });
  }
  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "survey",
      itemName: title,
      onDelete: async () => {
        const { error } = await supabase.from("surveys").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-surveys"] }),
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Surveys"
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("surveys", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "URL", get: (r) => r.qualtrics_url },
          ])
        }
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => setSummaryOpen(true)}>
          <Sparkles aria-hidden="true" />
          Summarize response CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    None yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {r.qualtrics_url}
                  </TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} survey</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              <Label>Qualtrics URL *</Label>
              <Input
                required
                type="url"
                value={form.qualtrics_url}
                onChange={(e) => setForm({ ...form, qualtrics_url: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <SurveySummaryDialog open={summaryOpen} onOpenChange={setSummaryOpen} />
      {dialog}
    </AdminShell>
  );
}
