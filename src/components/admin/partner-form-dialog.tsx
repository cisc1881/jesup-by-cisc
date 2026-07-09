import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
import { PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { PARTNERSHIP_FOCUS_AREAS } from "@/lib/partner-focus-areas";
import {
  emptyPartnerForm,
  fetchAdminPartnerForm,
  savePartner,
  slugify,
  uploadPartnerLogo,
  type PartnerFormData,
} from "@/lib/partners";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type PartnerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
  onSaved: () => void;
};

export function PartnerFormDialog({ open, onOpenChange, partnerId, onSaved }: PartnerFormDialogProps) {
  const [form, setForm] = useState<PartnerFormData>(emptyPartnerForm());
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: attachmentOptions } = useQuery({
    queryKey: ["partner-attachment-options"],
    queryFn: async () => {
      const [programs, events, publications, podcasts] = await Promise.all([
        supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
        supabase.from("events").select("id, title, starts_at").order("starts_at", { ascending: false }),
        supabase.from("publications").select("id, title").eq("is_active", true).order("title"),
        supabase.from("podcast_episodes").select("id, title, guest").eq("is_published", true).order("title"),
      ]);
      return {
        programs: (programs.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        events: (events.data ?? []).map((e) => ({ id: e.id, label: e.title, hint: fmtDateTime(e.starts_at) })),
        publications: (publications.data ?? []).map((p) => ({ id: p.id, label: p.title })),
        podcasts: (podcasts.data ?? []).map((p) => ({ id: p.id, label: p.title, hint: p.guest })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!partnerId) {
      setForm(emptyPartnerForm());
      return;
    }
    fetchAdminPartnerForm(partnerId)
      .then(setForm)
      .catch((err) => toast.error(err.message));
  }, [open, partnerId]);

  function toggleFocusArea(area: string) {
    setForm((f) => ({
      ...f,
      partnershipAreas: f.partnershipAreas.includes(area)
        ? f.partnershipAreas.filter((a) => a !== area)
        : [...f.partnershipAreas, area],
    }));
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const url = await uploadPartnerLogo(file);
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await savePartner(partnerId, form);
      toast.success("Partner saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partnerId ? "Edit partner" : "New partner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category || undefined} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {PARTNER_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Short description</Label>
                <Textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  placeholder="Card summary (1–2 sentences)"
                />
              </div>
              <div>
                <Label>Overview</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Mission</Label>
                <Textarea
                  rows={3}
                  value={form.mission}
                  onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                  <span className="text-sm">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 space-y-3">
              <div>
                <Label>Website URL</Label>
                <Input value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["linkedin", "twitter", "facebook", "instagram", "youtube"] as const).map((network) => (
                  <div key={network}>
                    <Label className="capitalize">{network}</Label>
                    <Input
                      value={form.socialLinks[network] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          socialLinks: { ...f.socialLinks, [network]: e.target.value || null },
                        }))
                      }
                      placeholder={`https://${network}.com/…`}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-3">
              <div>
                <Label>Logo</Label>
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="" className="mb-3 h-20 max-w-[200px] rounded-lg object-contain" />
                )}
                <Button type="button" variant="outline" disabled={uploadingLogo} asChild>
                  <label className="cursor-pointer">
                    {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload logo
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleLogoUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                <Input
                  className="mt-2"
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="Or paste logo URL"
                />
              </div>
            </TabsContent>

            <TabsContent value="focus" className="mt-4">
              <Label className="mb-3 block">Partnership focus areas</Label>
              <div className="flex flex-wrap gap-2">
                {PARTNERSHIP_FOCUS_AREAS.map((area) => {
                  const active = form.partnershipAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocusArea(area)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        active
                          ? "grad-crimson text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="relations" className="mt-4 space-y-4">
              <AttachmentPicker
                label="Related programs"
                options={attachmentOptions?.programs ?? []}
                selectedIds={form.programIds}
                onChange={(programIds) => setForm((f) => ({ ...f, programIds }))}
              />
              <AttachmentPicker
                label="Related events"
                options={attachmentOptions?.events ?? []}
                selectedIds={form.eventIds}
                onChange={(eventIds) => setForm((f) => ({ ...f, eventIds }))}
              />
              <AttachmentPicker
                label="Related publications"
                options={attachmentOptions?.publications ?? []}
                selectedIds={form.publicationIds}
                onChange={(publicationIds) => setForm((f) => ({ ...f, publicationIds }))}
              />
              <AttachmentPicker
                label="Related podcasts"
                options={attachmentOptions?.podcasts ?? []}
                selectedIds={form.podcastIds}
                onChange={(podcastIds) => setForm((f) => ({ ...f, podcastIds }))}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              <div>
                <Label>Internal notes</Label>
                <Textarea
                  rows={5}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Admin-only notes — not shown on the public site"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full grad-crimson text-white" disabled={saving}>
            {saving ? "Saving…" : "Save partner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
