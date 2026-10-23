import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  getPresenterStaffBoard,
  manageEventPresenter,
  savePresenterSettings,
} from "@/lib/presenter-submissions.functions";
import {
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_PRESENTER_MIME_TYPES,
  PRESENTER_MIME_OPTIONS,
  PRESENTER_TYPES,
} from "@/lib/presenter-submissions";
import { eventLocalInput, eventLocalToUtc } from "@/lib/conference";

/** Admin configuration for per-conference presenter submissions. */
export function PresenterAdminPanel({ eventId }: { eventId: string }) {
  const board = useServerFn(getPresenterStaffBoard);
  const saveSettings = useServerFn(savePresenterSettings);
  const managePresenter = useServerFn(manageEventPresenter);
  const qc = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["presenter-admin-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, timezone")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const timezone = event?.timezone ?? "America/Chicago";

  const query = useQuery({
    queryKey: ["presenter-staff-board", eventId],
    queryFn: () => board({ data: { eventId } }),
  });

  const [enabled, setEnabled] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [mimeTypes, setMimeTypes] = useState<string[]>(DEFAULT_PRESENTER_MIME_TYPES);
  const [maxMb, setMaxMb] = useState(String(DEFAULT_MAX_FILE_BYTES / (1024 * 1024)));
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const [newUserId, setNewUserId] = useState("");
  const [newType, setNewType] = useState<(typeof PRESENTER_TYPES)[number]>("student");
  const [newSession, setNewSession] = useState<string>("none");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const settings = query.data?.settings;
    if (!settings) return;
    setEnabled(settings.enabled);
    setOpensAt(eventLocalInput(settings.opensAt, timezone));
    setClosesAt(eventLocalInput(settings.closesAt, timezone));
    setMimeTypes(settings.allowedMimeTypes);
    setMaxMb(String(Math.round(settings.maxFileBytes / (1024 * 1024))));
    setInstructions(settings.instructions ?? "");
  }, [query.data?.settings, timezone]);

  async function run(action: () => Promise<unknown>, message = "Saved") {
    setBusy(true);
    try {
      await action();
      await qc.invalidateQueries({ queryKey: ["presenter-staff-board", eventId] });
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function saveSettingsNow() {
    let opensUtc: string | null = null;
    let closesUtc: string | null = null;
    try {
      opensUtc = opensAt ? eventLocalToUtc(opensAt, timezone) : null;
      closesUtc = closesAt ? eventLocalToUtc(closesAt, timezone) : null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check the opening and cutoff times");
      return;
    }
    if (opensUtc && closesUtc && closesUtc <= opensUtc) {
      toast.error("The cutoff must be after the opening time.");
      return;
    }
    void run(() =>
      saveSettings({
        data: {
          eventId,
          enabled,
          opensAt: opensUtc,
          closesAt: closesUtc,
          allowedMimeTypes: mimeTypes,
          maxFileBytes: Math.max(1, Number(maxMb) || 25) * 1024 * 1024,
          instructions: instructions.trim() || null,
        },
      }),
    );
  }

  if (query.isPending) return <p role="status">Loading presenter settings…</p>;
  if (query.error) return <p role="alert">{query.error.message}</p>;
  const data = query.data!;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="presenter-enabled">Enable presenter submissions</Label>
          <Switch id="presenter-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <p className="text-sm text-muted-foreground">
          Times are in the event timezone ({timezone}). Leave the opening time blank to open
          immediately when enabled. Presenters cannot upload or replace files after the cutoff
          unless you extend it here.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="presenter-opens">Opens at ({timezone})</Label>
            <Input
              id="presenter-opens"
              type="datetime-local"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="presenter-closes">Cutoff ({timezone})</Label>
            <Input
              id="presenter-closes"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </div>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Accepted file types</legend>
          <div className="flex flex-wrap gap-4">
            {PRESENTER_MIME_OPTIONS.map((option) => (
              <label key={option.mime} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={mimeTypes.includes(option.mime)}
                  onCheckedChange={(checked) =>
                    setMimeTypes((current) =>
                      checked === true
                        ? [...current, option.mime]
                        : current.filter((mime) => mime !== option.mime),
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="presenter-max-mb">Max file size (MB, up to 25)</Label>
            <Input
              id="presenter-max-mb"
              type="number"
              min={1}
              max={25}
              value={maxMb}
              onChange={(e) => setMaxMb(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="presenter-instructions">Instructions for presenters</Label>
          <Textarea
            id="presenter-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
          />
        </div>
        <Button type="button" disabled={busy || mimeTypes.length === 0} onClick={saveSettingsNow}>
          Save submission settings
        </Button>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Presenter access</h3>
        <p className="text-sm text-muted-foreground">
          Only people listed here can sign in and submit files. Add each invited student or faculty
          presenter by their JESUP account ID.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="presenter-user-id">Presenter account ID</Label>
            <Input
              id="presenter-user-id"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="UUID of the presenter's account"
            />
          </div>
          <div>
            <Label htmlFor="presenter-display-name">Display name (optional)</Label>
            <Input
              id="presenter-display-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label>Presenter type</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
              <SelectTrigger aria-label="Presenter type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESENTER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "faculty" ? "Faculty" : "Student"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Session (optional)</Label>
            <Select value={newSession} onValueChange={setNewSession}>
              <SelectTrigger aria-label="Presenter session"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No session linked</SelectItem>
                {data.sessions.map((session: any) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy || !newUserId.trim()}
          onClick={() =>
            void run(
              () =>
                managePresenter({
                  data: {
                    action: "upsert",
                    eventId,
                    userId: newUserId.trim(),
                    presenterType: newType,
                    sessionId: newSession === "none" ? null : newSession,
                    displayName: newName.trim() || null,
                  },
                }),
              "Presenter saved",
            )
          }
        >
          Add or update presenter
        </Button>
        <div className="divide-y">
          {data.presenters.map((presenter: any) => (
            <div key={presenter.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {presenter.display_name || presenter.profile?.full_name || presenter.profile?.email || presenter.user_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {presenter.presenter_type === "faculty" ? "Faculty" : "Student"}
                  {presenter.session_id
                    ? ` · ${data.sessions.find((s: any) => s.id === presenter.session_id)?.title ?? "Session"}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      managePresenter({
                        data: { action: "remove", eventId, presenterId: presenter.id },
                      }),
                    "Presenter removed",
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          {data.presenters.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No presenters assigned yet.</p>
          )}
        </div>
      </section>

      <section className="border-t pt-4">
        <Button asChild variant="outline">
          <Link to="/events/$id/presentations" params={{ id: eventId }}>
            Open staff presentation-files dashboard
          </Link>
        </Button>
      </section>
    </div>
  );
}
