import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "procurement-private";
const allowedMimes = ["application/pdf", "image/png", "image/jpeg"] as const;
const uploadInput = z.object({
  orderId: z.string().uuid(),
  kind: z.enum(["purchase_order", "tax_certificate"]),
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.enum(allowedMimes),
  fileSize: z.number().int().min(1).max(25 * 1024 * 1024),
});

async function requireBuyerOrManager(db: any, userId: string, orderId: string) {
  const { data: order, error } = await db.from("procurement_orders")
    .select("id,event_id,requester_user_id,procurement_status")
    .eq("id", orderId).maybeSingle();
  if (error || !order) throw new Error("Purchase not found or unavailable.");
  const { data: manager, error: managerError } = await db.rpc("can_manage_procurement_event", { p_event_id: order.event_id });
  if (managerError) throw managerError;
  if (order.requester_user_id !== userId && !manager) throw new Error("Purchase access required.");
  if (!manager && !["quote_requested", "quote_issued", "awaiting_purchase_order", "purchase_order_received"].includes(order.procurement_status)) {
    throw new Error("Documents can no longer be changed for this purchase.");
  }
  return order;
}

export const requestProcurementDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uploadInput)
  .handler(async ({ data, context }) => {
    await requireBuyerOrManager(context.supabase, context.userId, data.orderId);
    const extension = data.mimeType === "application/pdf" ? "pdf" : data.mimeType === "image/png" ? "png" : "jpg";
    const path = `${data.orderId}/${data.kind}/${crypto.randomUUID()}.${extension}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { path: signed.path, token: signed.token };
  });

const confirmInput = uploadInput.extend({ path: z.string().min(1).max(500) });
export const confirmProcurementDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(confirmInput)
  .handler(async ({ data, context }) => {
    await requireBuyerOrManager(context.supabase, context.userId, data.orderId);
    const extension = data.mimeType === "application/pdf" ? "pdf" : data.mimeType === "image/png" ? "png" : "jpg";
    const prefix = `${data.orderId}/${data.kind}/`;
    if (!data.path.startsWith(prefix) || !new RegExp(`^[a-f0-9-]{36}[.]${extension}$`).test(data.path.slice(prefix.length))) {
      throw new Error("Document path is invalid.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: objects, error: listError } = await supabaseAdmin.storage.from(BUCKET).list(prefix.slice(0, -1), { limit: 100 });
    if (listError) throw listError;
    const object = objects?.find((item) => item.name === data.path.slice(prefix.length));
    const metadata = object?.metadata as { size?: number; mimetype?: string } | undefined;
    if (!object || metadata?.size !== data.fileSize || metadata?.mimetype !== data.mimeType) {
      throw new Error("Uploaded document does not match the file details.");
    }
    const { data: document, error } = await supabaseAdmin.from("procurement_documents" as any).insert({
      order_id: data.orderId,
      kind: data.kind,
      storage_path: data.path,
      file_name: data.fileName,
      mime_type: data.mimeType,
      file_size: data.fileSize,
      audience: "buyer",
      uploaded_by: context.userId,
    } as any).select("id").single();
    if (error) throw error;
    return { documentId: (document as unknown as { id: string }).id };
  });

export const getProcurementDocumentDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ documentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // The caller's RLS-filtered lookup is the authorization boundary. Never
    // sign a path supplied directly by the browser.
    const { data: document, error } = await (context.supabase as any).from("procurement_documents")
      .select("id,storage_path").eq("id", data.documentId).maybeSingle();
    if (error || !document) throw new Error("Document not found or unavailable.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage.from(BUCKET)
      .createSignedUrl(document.storage_path, 60);
    if (signError) throw signError;
    return { url: signed.signedUrl };
  });
