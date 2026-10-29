import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/programs/$programId/links")({
  component: ProgramLinksEditor,
});

function ProgramLinksEditor() {
  const { programId } = Route.useParams();
  const qc = useQueryClient();
  const [targetType, setTargetType] = useState<"program" | "publication">("publication");
  const [targetId, setTargetId] = useState("");
  const [relationship, setRelationship] = useState("continue_learning");
  const [busy, setBusy] = useState(false);
  const queryKey = ["program-links-admin", programId];
  const { data: links = [], isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("extension_links")
        .select("*")
        .eq("source_type", "program")
        .eq("source_id", programId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: options = [] } = useQuery({
    queryKey: ["extension-targets", targetType],
    queryFn: async () => {
      if (targetType === "publication") {
        const { data, error } = await supabase
          .from("publications")
          .select("id,title")
          .eq("is_active", true)
          .not("published_at", "is", null)
          .not("slug", "is", null)
          .order("title");
        if (error) throw error;
        return (data ?? []).map((item) => ({ id: item.id, title: item.title }));
      }
      const { data, error } = await supabase
        .from("programs")
        .select("id,name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? [])
        .filter((item) => item.id !== programId)
        .map((item) => ({ id: item.id, title: item.name }));
    },
  });

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetId || busy) return;
    setBusy(true);
    const { error } = await productDb.from("extension_links").insert({
      source_type: "program",
      source_id: programId,
      target_type: targetType,
      target_id: targetId,
      relationship: relationship.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("Relationship could not be saved.");
      return;
    }
    setTargetId("");
    await qc.invalidateQueries({ queryKey });
    await qc.invalidateQueries({ queryKey: ["continue-learning", "program", programId] });
    toast.success("Relationship added.");
  }

  async function remove(id: string) {
    const { error } = await productDb.from("extension_links").delete().eq("id", id);
    if (error) toast.error("Relationship could not be removed.");
    else {
      await qc.invalidateQueries({ queryKey });
      await qc.invalidateQueries({ queryKey: ["continue-learning", "program", programId] });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Extension Graph
        </p>
        <h1 className="mt-2 text-3xl font-black">Related content</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect this program to verified resources for the Continue Learning section.
        </p>
      </header>
      <form
        onSubmit={(event) => void add(event)}
        className="grid gap-4 rounded-2xl border bg-card p-5"
      >
        <label className="text-sm font-bold">
          Type
          <select
            value={targetType}
            onChange={(event) => {
              setTargetType(event.target.value as "program" | "publication");
              setTargetId("");
            }}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            <option value="publication">Publication</option>
            <option value="program">Program</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Related item
          <select
            required
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            <option value="">Choose content</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Relationship
          <input
            required
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <button
          disabled={busy}
          type="submit"
          className="min-h-11 rounded-xl bg-primary px-5 font-bold text-primary-foreground"
        >
          Add relationship
        </button>
      </form>
      <section aria-label="Current relationships" className="space-y-2">
        {isError && (
          <p role="alert" className="text-destructive">
            Relationships could not be loaded. Apply the product migration if needed.
          </p>
        )}
        {links.length === 0 && !isError && (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            No related content has been connected.
          </p>
        )}
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <p className="flex-1 text-sm font-semibold">
              {link.target_type} · {link.relationship} ·{" "}
              {options.find((item) => item.id === link.target_id)?.title ?? link.target_id}
            </p>
            <button
              type="button"
              onClick={() => void remove(link.id)}
              className="min-h-11 rounded-lg border px-4 text-sm font-bold"
            >
              Remove
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
