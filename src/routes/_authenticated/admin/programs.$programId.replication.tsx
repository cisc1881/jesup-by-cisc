import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/programs/$programId/replication")({
  component: ReplicationEditor,
});

const fields = [
  ["impact_metrics", "Impact metrics"],
  ["curriculum", "Curriculum"],
  ["resources", "Resources"],
  ["timeline", "Timeline"],
  ["outcome_measures", "Outcome measures"],
] as const;
type ListKey = (typeof fields)[number][0];
type Form = Record<ListKey, string> & {
  evaluation_methodology: string;
  budget: string;
  contact_name: string;
  contact_email: string;
  is_published: boolean;
};
const empty: Form = {
  impact_metrics: "",
  curriculum: "",
  resources: "",
  timeline: "",
  outcome_measures: "",
  evaluation_methodology: "",
  budget: "",
  contact_name: "",
  contact_email: "",
  is_published: false,
};

function ReplicationEditor() {
  const { programId } = Route.useParams();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const { data: guide, isError } = useQuery({
    queryKey: ["program-replication-admin", programId],
    queryFn: async () => {
      const { data, error } = await productDb
        .from("program_replication_guides")
        .select("*")
        .eq("program_id", programId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!guide) return;
    const lists = Object.fromEntries(
      fields.map(([key]) => [
        key,
        Array.isArray(guide[key])
          ? guide[key].filter((item): item is string => typeof item === "string").join("\n")
          : "",
      ]),
    ) as Record<ListKey, string>;
    const budget =
      guide.budget && typeof guide.budget === "object" && !Array.isArray(guide.budget)
        ? Object.entries(guide.budget)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join("\n")
        : "";
    setForm({
      ...lists,
      budget,
      evaluation_methodology: guide.evaluation_methodology ?? "",
      contact_name: guide.contact_name ?? "",
      contact_email: guide.contact_email ?? "",
      is_published: guide.is_published,
    });
  }, [guide]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const budget: Record<string, string> = {};
    for (const line of form.budget
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)) {
      const index = line.indexOf(":");
      if (index < 1) {
        toast.error("Each budget line needs a label and value separated by a colon.");
        return;
      }
      budget[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
    setBusy(true);
    const lists = Object.fromEntries(
      fields.map(([key]) => [
        key,
        form[key]
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      ]),
    );
    const { error } = await productDb.from("program_replication_guides").upsert({
      program_id: programId,
      ...lists,
      budget,
      evaluation_methodology: form.evaluation_methodology.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      toast.error("Guide could not be saved.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["program-replication", programId] });
    await qc.invalidateQueries({ queryKey: ["program-replication-admin", programId] });
    toast.success("Replication guide saved.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Program administration
        </p>
        <h1 className="mt-2 text-3xl font-black">Replication guide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish only verified methods, costs, and outcomes. One item per line.
        </p>
      </header>
      {isError && (
        <p role="alert" className="mt-5 text-destructive">
          The guide could not be loaded. Apply the product migration if needed.
        </p>
      )}
      <form
        onSubmit={(event) => void save(event)}
        className="mt-7 space-y-5 rounded-2xl border bg-card p-5"
      >
        {fields.map(([key, label]) => (
          <label key={key} className="block text-sm font-bold">
            {label}
            <textarea
              rows={4}
              value={form[key]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.value }))
              }
              className="mt-2 w-full rounded-lg border bg-background p-3 font-normal"
            />
          </label>
        ))}
        <label className="block text-sm font-bold">
          Budget (label: value per line)
          <textarea
            rows={4}
            value={form.budget}
            onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
            className="mt-2 w-full rounded-lg border bg-background p-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Evaluation methodology
          <textarea
            rows={4}
            value={form.evaluation_methodology}
            onChange={(event) =>
              setForm((current) => ({ ...current, evaluation_methodology: event.target.value }))
            }
            className="mt-2 w-full rounded-lg border bg-background p-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Contact name
          <input
            value={form.contact_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact_name: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Contact email
          <input
            type="email"
            value={form.contact_email}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact_email: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(event) =>
              setForm((current) => ({ ...current, is_published: event.target.checked }))
            }
          />
          Publish guide
        </label>
        <button
          type="submit"
          disabled={busy || isError}
          className="min-h-11 rounded-xl bg-primary px-6 font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save guide"}
        </button>
      </form>
    </div>
  );
}
