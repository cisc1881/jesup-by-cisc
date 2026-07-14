import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import {
  fetchPlatformSettings,
  savePlatformSetting,
  SETTINGS_SECTIONS,
  type PlatformSettings,
} from "@/modules/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAiConfigurationStatusServerFn } from "@/modules/ai/status-server-fn";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<keyof PlatformSettings>("organization");
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: fetchPlatformSettings,
  });
  const { data: aiStatus, isLoading: aiStatusLoading } = useQuery({
    queryKey: ["ai-configuration-status"],
    queryFn: () => getAiConfigurationStatusServerFn(),
  });

  const current = draft ?? settings;

  async function handleSave() {
    if (!current) return;
    if (activeSection === "ai" && current.ai.enabled && !current.ai.provider) {
      toast.error("Select an AI provider before enabling AI services.");
      return;
    }
    setSaving(true);
    try {
      await savePlatformSetting(activeSection, current[activeSection]);
      toast.success("Settings saved");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      qc.invalidateQueries({ queryKey: ["ai-configuration-status"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateDraft<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setDraft((prev) => ({ ...(prev ?? settings ?? ({} as PlatformSettings)), [key]: value }));
  }

  if (isLoading || !current) {
    return (
      <CommandCenterContentShell>
        <p className="text-muted-foreground">Loading settings…</p>
      </CommandCenterContentShell>
    );
  }

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="System Settings"
        description="Organization profile, brand assets, integrations, and platform configuration."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="space-y-1">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                setActiveSection(section.key);
                setDraft(null);
              }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeSection === section.key
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {section.label}
            </button>
          ))}
          <div className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground">
            User Roles are managed in the Users section.
          </div>
        </nav>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="font-semibold text-foreground">
                {SETTINGS_SECTIONS.find((s) => s.key === activeSection)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {SETTINGS_SECTIONS.find((s) => s.key === activeSection)?.description}
              </p>
            </div>

            {activeSection === "organization" && (
              <>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={current.organization.name}
                    onChange={(e) =>
                      updateDraft("organization", { ...current.organization, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={current.organization.institution}
                    onChange={(e) =>
                      updateDraft("organization", {
                        ...current.organization,
                        institution: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={current.organization.tagline}
                    onChange={(e) =>
                      updateDraft("organization", {
                        ...current.organization,
                        tagline: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {activeSection === "brand" && (
              <>
                <div>
                  <Label>Primary color</Label>
                  <Input
                    value={current.brand.primaryColor}
                    onChange={(e) =>
                      updateDraft("brand", { ...current.brand, primaryColor: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Accent color</Label>
                  <Input
                    value={current.brand.accentColor}
                    onChange={(e) =>
                      updateDraft("brand", { ...current.brand, accentColor: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {activeSection === "homepage" && (
              <label className="flex items-center gap-3">
                <Switch
                  checked={current.homepage.heroEnabled}
                  onCheckedChange={(v) => updateDraft("homepage", { heroEnabled: v })}
                />
                <span>Enable hero carousel</span>
              </label>
            )}

            {activeSection === "navigation" && (
              <label className="flex items-center gap-3">
                <Switch
                  checked={current.navigation.showDonate}
                  onCheckedChange={(v) => updateDraft("navigation", { showDonate: v })}
                />
                <span>Show donate link in navigation</span>
              </label>
            )}

            {activeSection === "maps" && (
              <div>
                <Label>Map provider</Label>
                <Input
                  value={current.maps.provider}
                  onChange={(e) =>
                    updateDraft("maps", { provider: e.target.value as "google" | "apple" })
                  }
                />
              </div>
            )}

            {activeSection === "qualtrics" && (
              <>
                <label className="flex items-center gap-3">
                  <Switch
                    checked={current.qualtrics.enabled}
                    onCheckedChange={(v) =>
                      updateDraft("qualtrics", { ...current.qualtrics, enabled: v })
                    }
                  />
                  <span>Enable Qualtrics integration</span>
                </label>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={current.qualtrics.baseUrl ?? ""}
                    onChange={(e) =>
                      updateDraft("qualtrics", {
                        ...current.qualtrics,
                        baseUrl: e.target.value || null,
                      })
                    }
                  />
                </div>
              </>
            )}

            {activeSection === "ai" && (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">Server configuration</p>
                      <p className="text-sm text-muted-foreground">
                        API keys remain server-only and are never displayed here.
                      </p>
                    </div>
                    <Badge variant={aiStatus?.configured ? "default" : "secondary"}>
                      {aiStatusLoading ? "Checking…" : aiStatus?.configured ? "Ready" : "Not ready"}
                    </Badge>
                  </div>
                  {aiStatus && (
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Selected provider</dt>
                        <dd className="font-medium capitalize">{aiStatus.provider ?? "None"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Server model</dt>
                        <dd className="font-medium">{aiStatus.model ?? "Not selected"}</dd>
                      </div>
                    </dl>
                  )}
                  {aiStatus?.issue && (
                    <p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="status">
                      {aiStatus.issue}
                    </p>
                  )}
                </div>
                <label className="flex items-center gap-3">
                  <Switch
                    checked={current.ai.enabled}
                    onCheckedChange={(enabled) => updateDraft("ai", { ...current.ai, enabled })}
                  />
                  <span>Enable Ask JESUP AI services</span>
                </label>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={current.ai.provider ?? "none"}
                    onValueChange={(provider) =>
                      updateDraft("ai", {
                        ...current.ai,
                        provider: provider === "none" ? null : (provider as "openai" | "anthropic"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Configure the matching server environment variable before enabling this feature.
                  </p>
                </div>
              </>
            )}

            {activeSection === "email" && (
              <>
                <div>
                  <Label>From name</Label>
                  <Input
                    value={current.email.fromName}
                    onChange={(e) =>
                      updateDraft("email", { ...current.email, fromName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>From address</Label>
                  <Input
                    value={current.email.fromAddress ?? ""}
                    onChange={(e) =>
                      updateDraft("email", {
                        ...current.email,
                        fromAddress: e.target.value || null,
                      })
                    }
                  />
                </div>
              </>
            )}

            {activeSection === "storage" && (
              <div>
                <Label>Default bucket</Label>
                <Input
                  value={current.storage.defaultBucket}
                  onChange={(e) => updateDraft("storage", { defaultBucket: e.target.value })}
                />
              </div>
            )}

            <Button onClick={handleSave} disabled={saving || !draft}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </CommandCenterContentShell>
  );
}
