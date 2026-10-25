import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { effectivePaymentStatus, listAllProcurementOrders, money } from "@/lib/procurement";

export const Route = createFileRoute("/_authenticated/admin/finance/purchase-orders")({ component: PurchaseOrdersAdmin });

function PurchaseOrdersAdmin() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data: orders = [], isLoading, error } = useQuery({ queryKey: ["admin-procurement-orders"], queryFn: listAllProcurementOrders, retry: false });
  const rows = orders.filter((order) => {
    const haystack = [order.institution_name, order.billing_contact_name, order.billing_contact_email, order.quote_number, order.po_number, order.invoice_number, order.events?.title].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase()) && (status === "all" || order.procurement_status === status);
  });
  const outstanding = orders.reduce((sum, order) => sum + (order.invoice_number ? order.total_cents - order.paid_cents : 0), 0);
  const pastDue = orders.filter((order) => effectivePaymentStatus(order) === "past_due");
  return <AdminShell>
    <AdminPageHeader title="Purchase Orders" description="Institutional quotes, POs, invoices, and reconciliation."
      searchValue={search} onSearchChange={setSearch}
      onExport={() => downloadCsv("purchase-orders", rows, [
        { header: "Institution", get: (o) => o.institution_name }, { header: "Event", get: (o) => o.events?.title },
        { header: "Buyer", get: (o) => o.billing_contact_email }, { header: "Quote", get: (o) => o.quote_number },
        { header: "PO", get: (o) => o.po_number }, { header: "Invoice", get: (o) => o.invoice_number },
        { header: "Total USD", get: (o) => money(o.total_cents) }, { header: "Paid USD", get: (o) => money(o.paid_cents) },
        { header: "Balance USD", get: (o) => money(o.total_cents - o.paid_cents) },
        { header: "Due", get: (o) => o.due_at }, { header: "Status", get: (o) => o.procurement_status },
        { header: "Payment", get: (o) => effectivePaymentStatus(o) },
      ])} />
    <div className="grid gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Quotes requested" value={String(orders.filter((o) => o.procurement_status === "quote_requested").length)} />
      <Metric label="POs received" value={String(orders.filter((o) => o.procurement_status === "purchase_order_received").length)} />
      <Metric label="Outstanding balance" value={money(outstanding)} />
      <Metric label="Past due" value={`${pastDue.length} · ${money(pastDue.reduce((sum, o) => sum + o.total_cents - o.paid_cents, 0))}`} />
    </div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label htmlFor="po-status-filter" className="text-sm font-semibold">Status</label>
      <select id="po-status-filter" className="min-h-11 rounded-md border bg-background px-3" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="all">All statuses</option>
        {Array.from(new Set(orders.map((o) => o.procurement_status))).sort().map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
    </div>
    <Card><CardContent className="p-0">
      {error ? <p className="p-8 text-destructive">Finance records are unavailable until the procurement migration is applied.</p> :
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Institution / buyer</TableHead><TableHead>Event</TableHead><TableHead>References</TableHead><TableHead>Amount / balance</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>
          {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">No institutional purchases found.</TableCell></TableRow>}
          {rows.map((order) => <TableRow key={order.id}>
            <TableCell><div className="font-semibold">{order.institution_name}</div><div className="text-xs text-muted-foreground">{order.billing_contact_name} · {order.billing_contact_email}</div></TableCell>
            <TableCell>{order.events?.title ?? "Other purchase"}</TableCell>
            <TableCell className="text-xs"><div>{order.quote_number}</div><div>{order.po_number}</div><div>{order.invoice_number}</div></TableCell>
            <TableCell><div>{money(order.total_cents)}</div><div className="text-xs text-muted-foreground">{money(order.total_cents - order.paid_cents)} due</div></TableCell>
            <TableCell><Badge variant="secondary">{order.procurement_status.replaceAll("_", " ")}</Badge></TableCell>
            <TableCell><Button size="sm" variant="outline" asChild><Link to="/admin/finance/purchase-orders/$id" params={{ id: order.id }}>Review</Link></Button></TableCell>
          </TableRow>)}
        </TableBody></Table></div>}
    </CardContent></Card>
  </AdminShell>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></CardContent></Card>;
}
