import { supabase } from "@/integrations/supabase/client";

// The procurement tables are introduced by migration 0013. Supabase's generated
// types are updated when that migration is applied to the managed project.
const db = supabase as any;

export type ProcurementStatus =
  | "draft" | "quote_requested" | "quote_issued" | "awaiting_purchase_order"
  | "purchase_order_received" | "under_review" | "registration_confirmed"
  | "invoice_issued" | "payment_pending" | "partially_paid" | "paid"
  | "past_due" | "cancelled" | "rejected";

export type ProcurementOrder = {
  id: string;
  event_id: string | null;
  requester_user_id: string;
  institution_name: string;
  billing_contact_name: string;
  billing_contact_email: string;
  po_number: string | null;
  quote_number: string | null;
  invoice_number: string | null;
  procurement_status: ProcurementStatus;
  payment_status: string;
  total_cents: number;
  paid_cents: number;
  due_at: string | null;
  quote_expires_at: string | null;
  created_at: string;
  events?: { title: string } | null;
};

export type ProcurementEventSettings = {
  event_id: string;
  enabled: boolean;
  accepted_methods: string[];
  seller_name: string | null;
  terms: string;
  quote_expiration_days: number;
  confirm_registration_on: string;
  remit_instructions: string | null;
};

export type ProcurementProduct = {
  id: string;
  name: string;
  kind: string;
  price_cents: number | null;
  is_active: boolean;
};

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function effectivePaymentStatus(order: Pick<ProcurementOrder, "paid_cents" | "total_cents" | "due_at" | "invoice_number">, now = new Date()): string {
  if (order.invoice_number && order.total_cents > 0 && order.paid_cents >= order.total_cents) return "paid";
  if (order.due_at && new Date(order.due_at) < now && order.paid_cents < order.total_cents) return "past_due";
  return order.paid_cents > 0 ? "partially_paid" : "unpaid";
}

export function paymentDueDate(issuedAt: Date, terms: string, customDays = 30): Date {
  const days: Record<string, number> = { due_on_receipt: 0, net_15: 15, net_30: 30, net_45: 45, net_60: 60 };
  const count = terms === "custom" ? customDays : days[terms];
  if (!Number.isInteger(count) || count < 0 || count > 365) throw new Error("Invalid payment terms");
  const result = new Date(issuedAt);
  result.setUTCDate(result.getUTCDate() + count);
  return result;
}

export async function getProcurementEventSettings(eventId: string): Promise<ProcurementEventSettings | null> {
  const { data, error } = await db.from("procurement_event_settings").select("*").eq("event_id", eventId).maybeSingle();
  if (error) throw error;
  return data as ProcurementEventSettings | null;
}

export async function saveProcurementEventSettings(input: {
  eventId: string; enabled: boolean; sellerName: string; remitInstructions: string;
  terms: string; quoteExpirationDays: number; confirmOn: string;
}) {
  const { error } = await db.rpc("save_procurement_event_settings", {
    p_event_id: input.eventId,
    p_enabled: input.enabled,
    p_methods: ["purchase_order", "invoice"],
    p_seller_name: input.sellerName,
    p_seller_address: {},
    p_remit_instructions: input.remitInstructions,
    p_terms: input.terms,
    p_custom_terms_days: null,
    p_quote_expiration_days: input.quoteExpirationDays,
    p_confirm_on: input.confirmOn,
  });
  if (error) throw error;
}

export async function getProcurementProducts(eventId: string): Promise<ProcurementProduct[]> {
  const { data, error } = await supabase.from("event_products")
    .select("id,name,kind,price_cents,is_active").eq("event_id", eventId).eq("is_active", true).order("sort_order");
  if (error) throw error;
  return (data ?? []) as ProcurementProduct[];
}

export async function requestProcurementQuote(input: {
  eventId: string;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  department?: string;
  apEmail?: string;
  notes?: string;
  lines: { productId: string; quantity: number }[];
  registrants: { name: string; email?: string }[];
}): Promise<string> {
  const { data, error } = await db.rpc("request_procurement_quote", {
    p_event_id: input.eventId,
    p_profile_id: null,
    p_billing: {
      institution_name: input.institutionName,
      billing_contact_name: input.contactName,
      billing_contact_email: input.contactEmail,
      department: input.department ?? null,
      ap_email: input.apEmail ?? null,
      notes: input.notes ?? null,
    },
    p_lines: input.lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
    p_registrants: input.registrants,
  });
  if (error) throw error;
  return data as string;
}

export async function listMyProcurementOrders(): Promise<ProcurementOrder[]> {
  const { data, error } = await db.from("procurement_orders")
    .select("id,event_id,requester_user_id,institution_name,billing_contact_name,billing_contact_email,po_number,quote_number,invoice_number,procurement_status,payment_status,total_cents,paid_cents,due_at,quote_expires_at,created_at,events(title)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProcurementOrder[];
}

export async function listAllProcurementOrders(): Promise<ProcurementOrder[]> {
  return listMyProcurementOrders();
}

export async function getProcurementOrder(id: string) {
  const { data, error } = await db.from("procurement_orders").select("*,events(title),procurement_order_lines(*),procurement_registrants(*),procurement_documents(id,kind,file_name,created_at,audience),procurement_activity_log(id,action,created_at,details)").eq("id", id).single();
  if (error) throw error;
  return data as ProcurementOrder & Record<string, any>;
}

export async function approveProcurementPo(orderId: string) {
  const { error } = await db.rpc("approve_procurement_po", { p_order_id: orderId });
  if (error) throw error;
}

export async function issueProcurementQuote(orderId: string): Promise<string> {
  const { data, error } = await db.rpc("issue_procurement_quote", { p_order_id: orderId });
  if (error) throw error;
  return data as string;
}

export async function issueProcurementInvoice(orderId: string): Promise<string> {
  const { data, error } = await db.rpc("issue_procurement_invoice", { p_order_id: orderId });
  if (error) throw error;
  return data as string;
}

export async function recordProcurementPayment(input: {
  orderId: string; amountCents: number; receivedAt: string; method: string; reference?: string;
}) {
  const { error } = await db.rpc("record_procurement_payment", {
    p_order_id: input.orderId,
    p_amount_cents: input.amountCents,
    p_received_at: input.receivedAt,
    p_method: input.method,
    p_reference: input.reference ?? null,
    p_transaction_id: null,
    p_notes: null,
  });
  if (error) throw error;
}
