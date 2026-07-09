import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DAY_LABELS,
  MARKET_PRODUCT_CATEGORY_LABELS,
  emptyMarketForm,
  fetchAdminMarketForm,
  saveMarket,
  slugify,
  uploadMarketImage,
  type MarketAnnouncementType,
  type MarketFormData,
  type MarketProductCategory,
} from "@/lib/markets";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

type MarketFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string | null;
  onSaved: () => void;
};

const productCategories = Object.entries(MARKET_PRODUCT_CATEGORY_LABELS) as [MarketProductCategory, string][];
const announcementTypes: MarketAnnouncementType[] = ["general", "closure", "weather", "seasonal"];

export function MarketFormDialog({ open, onOpenChange, marketId, onSaved }: MarketFormDialogProps) {
  const [form, setForm] = useState<MarketFormData>(emptyMarketForm());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVendorLogo, setUploadingVendorLogo] = useState<number | null>(null);

  const { data: attachmentOptions } = useQuery({
    queryKey: ["market-attachment-options"],
    queryFn: async () => {
      const [events, programs] = await Promise.all([
        supabase.from("events").select("id, title").eq("is_active", true).order("title"),
        supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
      ]);
      return {
        events: (events.data ?? []).map((e) => ({ id: e.id, label: e.title })),
        programs: (programs.data ?? []).map((p) => ({ id: p.id, label: p.name })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!marketId) {
      setForm(emptyMarketForm());
      return;
    }
    fetchAdminMarketForm(marketId)
      .then(setForm)
      .catch((err) => toast.error(err.message));
  }, [open, marketId]);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadMarketImage(file, "covers");
      setForm((f) => ({ ...f, coverImageUrl: url }));
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(file: File) {
    setUploadingGallery(true);
    try {
      const url = await uploadMarketImage(file, "gallery");
      setForm((f) => ({
        ...f,
        gallery: [...f.gallery, { imageUrl: url, caption: "", sortOrder: f.gallery.length }],
      }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleVendorLogoUpload(vendorIndex: number, file: File) {
    setUploadingVendorLogo(vendorIndex);
    try {
      const url = await uploadMarketImage(file, "vendors");
      setForm((f) => ({
        ...f,
        vendors: f.vendors.map((v, i) => (i === vendorIndex ? { ...v, logoUrl: url } : v)),
      }));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingVendorLogo(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMarket(marketId, form);
      toast.success("Market saved");
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
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{marketId ? "Edit market" : "Create market"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basics">
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Season</Label>
                  <Input value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} placeholder="Year-round, Apr–Oct…" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Summary hours</Label>
                  <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="Sat 8am–12pm" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
                </div>
                <div>
                  <Label>Latitude</Label>
                  <Input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} />
                </div>
                <div>
                  <Label>Contact name</Label>
                  <Input value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Parking</Label>
                  <Textarea value={form.parkingInfo} onChange={(e) => setForm((f) => ({ ...f, parkingInfo: e.target.value }))} rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Payment notes</Label>
                  <Textarea value={form.paymentNotes} onChange={(e) => setForm((f) => ({ ...f, paymentNotes: e.target.value }))} rows={2} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.acceptsSnapEbt} onCheckedChange={(v) => setForm((f) => ({ ...f, acceptsSnapEbt: v }))} />
                  <Label>Accepts SNAP/EBT</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.acceptsCredit} onCheckedChange={(v) => setForm((f) => ({ ...f, acceptsCredit: v }))} />
                  <Label>Accepts credit cards</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                  <Label>Featured market</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  <Label>Active (published)</Label>
                </div>
                <div className="sm:col-span-2">
                  <Label>Cover image</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {form.coverImageUrl && (
                      <img src={form.coverImageUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload cover
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleCoverUpload(file);
                        }}
                      />
                    </label>
                    <Input
                      className="max-w-md"
                      value={form.coverImageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-3 pt-4">
              {form.structuredHours.map((hour, index) => (
                <div key={hour.dayOfWeek} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[140px_1fr_1fr_auto] sm:items-center">
                  <div className="font-medium">{DAY_LABELS[hour.dayOfWeek]}</div>
                  <Input
                    type="time"
                    value={hour.opensAt}
                    disabled={hour.isClosed}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        structuredHours: f.structuredHours.map((h, i) =>
                          i === index ? { ...h, opensAt: e.target.value } : h,
                        ),
                      }))
                    }
                  />
                  <Input
                    type="time"
                    value={hour.closesAt}
                    disabled={hour.isClosed}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        structuredHours: f.structuredHours.map((h, i) =>
                          i === index ? { ...h, closesAt: e.target.value } : h,
                        ),
                      }))
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={hour.isClosed}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          structuredHours: f.structuredHours.map((h, i) =>
                            i === index ? { ...h, isClosed: v } : h,
                          ),
                        }))
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleGalleryUpload(file);
                  }}
                />
              </label>
              {form.gallery.map((image, index) => (
                <div key={index} className="flex gap-3 rounded-lg border p-3">
                  <img src={image.imageUrl} alt="" className="h-16 w-24 rounded object-cover" />
                  <Input
                    className="flex-1"
                    value={image.caption ?? ""}
                    placeholder="Caption"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        gallery: f.gallery.map((g, i) => (i === index ? { ...g, caption: e.target.value } : g)),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="vendors" className="space-y-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    vendors: [
                      ...f.vendors,
                      {
                        name: "",
                        slug: "",
                        description: "",
                        logoUrl: "",
                        websiteUrl: "",
                        socialUrl: "",
                        contactName: "",
                        contactEmail: "",
                        contactPhone: "",
                        seasonalAvailability: "",
                        sortOrder: f.vendors.length,
                        isActive: true,
                        products: [],
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add vendor
              </Button>
              {form.vendors.map((vendor, vendorIndex) => (
                <div key={vendorIndex} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Vendor {vendorIndex + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setForm((f) => ({ ...f, vendors: f.vendors.filter((_, i) => i !== vendorIndex) }))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder="Vendor name *"
                      value={vendor.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          vendors: f.vendors.map((v, i) =>
                            i === vendorIndex
                              ? { ...v, name: e.target.value, slug: v.slug || slugify(e.target.value) }
                              : v,
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Seasonal availability"
                      value={vendor.seasonalAvailability ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          vendors: f.vendors.map((v, i) =>
                            i === vendorIndex ? { ...v, seasonalAvailability: e.target.value } : v,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      className="sm:col-span-2"
                      placeholder="Description"
                      value={vendor.description ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          vendors: f.vendors.map((v, i) =>
                            i === vendorIndex ? { ...v, description: e.target.value } : v,
                          ),
                        }))
                      }
                    />
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                      {vendor.logoUrl && <img src={vendor.logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        {uploadingVendorLogo === vendorIndex ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleVendorLogoUpload(vendorIndex, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Products</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            vendors: f.vendors.map((v, i) =>
                              i === vendorIndex
                                ? {
                                    ...v,
                                    products: [
                                      ...v.products,
                                      {
                                        name: "",
                                        category: "vegetables" as MarketProductCategory,
                                        description: "",
                                        availableToday: false,
                                        season: "",
                                        isOrganic: false,
                                        isLocal: true,
                                        sortOrder: v.products.length,
                                      },
                                    ],
                                  }
                                : v,
                            ),
                          }))
                        }
                      >
                        <Plus className="h-3 w-3" /> Product
                      </Button>
                    </div>
                    {vendor.products.map((product, productIndex) => (
                      <div key={productIndex} className="grid gap-2 rounded border p-2 sm:grid-cols-[1fr_140px_auto]">
                        <Input
                          placeholder="Product name"
                          value={product.name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              vendors: f.vendors.map((v, i) =>
                                i === vendorIndex
                                  ? {
                                      ...v,
                                      products: v.products.map((p, pi) =>
                                        pi === productIndex ? { ...p, name: e.target.value } : p,
                                      ),
                                    }
                                  : v,
                              ),
                            }))
                          }
                        />
                        <Select
                          value={product.category}
                          onValueChange={(v) =>
                            setForm((f) => ({
                              ...f,
                              vendors: f.vendors.map((ven, i) =>
                                i === vendorIndex
                                  ? {
                                      ...ven,
                                      products: ven.products.map((p, pi) =>
                                        pi === productIndex ? { ...p, category: v as MarketProductCategory } : p,
                                      ),
                                    }
                                  : ven,
                              ),
                            }))
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {productCategories.map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              vendors: f.vendors.map((v, i) =>
                                i === vendorIndex
                                  ? { ...v, products: v.products.filter((_, pi) => pi !== productIndex) }
                                  : v,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <label className="flex items-center gap-2 text-xs sm:col-span-3">
                          <Switch
                            checked={product.availableToday}
                            onCheckedChange={(v) =>
                              setForm((f) => ({
                                ...f,
                                vendors: f.vendors.map((ven, i) =>
                                  i === vendorIndex
                                    ? {
                                        ...ven,
                                        products: ven.products.map((p, pi) =>
                                          pi === productIndex ? { ...p, availableToday: v } : p,
                                        ),
                                      }
                                    : ven,
                                ),
                              }))
                            }
                          />
                          Available today
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    announcements: [
                      ...f.announcements,
                      {
                        title: "",
                        body: "",
                        announcementType: "general" as MarketAnnouncementType,
                        startsAt: "",
                        endsAt: "",
                        isActive: true,
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add announcement
              </Button>
              {form.announcements.map((announcement, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Announcement {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({ ...f, announcements: f.announcements.filter((_, i) => i !== index) }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Title"
                    value={announcement.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        announcements: f.announcements.map((a, i) =>
                          i === index ? { ...a, title: e.target.value } : a,
                        ),
                      }))
                    }
                  />
                  <Select
                    value={announcement.announcementType}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        announcements: f.announcements.map((a, i) =>
                          i === index ? { ...a, announcementType: v as MarketAnnouncementType } : a,
                        ),
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {announcementTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Body"
                    value={announcement.body ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        announcements: f.announcements.map((a, i) =>
                          i === index ? { ...a, body: e.target.value } : a,
                        ),
                      }))
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="datetime-local"
                      value={announcement.startsAt ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          announcements: f.announcements.map((a, i) =>
                            i === index ? { ...a, startsAt: e.target.value } : a,
                          ),
                        }))
                      }
                    />
                    <Input
                      type="datetime-local"
                      value={announcement.endsAt ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          announcements: f.announcements.map((a, i) =>
                            i === index ? { ...a, endsAt: e.target.value } : a,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="relations" className="space-y-4 pt-4">
              <AttachmentPicker
                label="Linked events"
                options={attachmentOptions?.events ?? []}
                selectedIds={form.eventIds}
                onChange={(ids) => setForm((f) => ({ ...f, eventIds: ids }))}
              />
              <AttachmentPicker
                label="Linked programs"
                options={attachmentOptions?.programs ?? []}
                selectedIds={form.programIds}
                onChange={(ids) => setForm((f) => ({ ...f, programIds: ids }))}
              />
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save market"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
