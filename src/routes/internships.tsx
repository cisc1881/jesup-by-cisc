import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/internships")({
  head: () => ({ meta: [{ title: "Internships · CISC Connect" }, { name: "description", content: "Open internship positions at CISC." }] }),
  component: InternshipsPage,
});

function InternshipsPage() {
  const { data } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("internships").select("*").eq("is_open", true).order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <PageHeader title="Internships" description="Gain experience while contributing to community impact." />
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-4 md:grid-cols-2">
        {(!data || data.length === 0) && <p className="text-muted-foreground">No open internships at this time.</p>}
        {data?.map((i) => <InternshipCard key={i.id} i={i} />)}
      </div>
    </PublicLayout>
  );
}

function InternshipCard({ i }: { i: any }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth", search: { next: "/internships" } });
    setBusy(true);
    let resume_url: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("resumes").upload(path, file);
      if (up.error) { setBusy(false); return toast.error(up.error.message); }
      resume_url = path;
    }
    const { error } = await supabase.from("internship_applications").insert({
      internship_id: i.id, user_id: user.id, cover_letter: cover || null, resume_url,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted!");
    setOpen(false); setCover(""); setFile(null);
    qc.invalidateQueries({ queryKey: ["my-apps"] });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><Briefcase className="h-5 w-5" /></div>
        {i.department && <div className="mt-3 text-xs font-medium uppercase tracking-wider text-accent">{i.department}</div>}
        <h3 className="mt-1 font-serif text-lg font-semibold text-primary">{i.title}</h3>
        {i.description && <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>}
        {i.deadline && <p className="mt-2 text-sm text-muted-foreground">Apply by {fmtDate(i.deadline)}</p>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={(e) => { if (!user) { e.preventDefault(); navigate({ to: "/auth", search: { next: "/internships" } }); } }}>
              {user ? "Apply" : "Sign in to apply"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply · {i.title}</DialogTitle></DialogHeader>
            <form onSubmit={apply} className="space-y-3">
              <div><Label>Cover letter</Label><Textarea rows={5} value={cover} onChange={(e) => setCover(e.target.value)} /></div>
              <div><Label>Resume (PDF)</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90">{busy ? "Submitting…" : "Submit application"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
