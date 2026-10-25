import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { AppCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { effectivePaymentStatus, listMyProcurementOrders, money } from "@/lib/procurement";

export const Route = createFileRoute("/_authenticated/account/purchases")({ component: PurchasesPage });

function PurchasesPage() {
  const { data: orders = [], isLoading, error } = useQuery({ queryKey: ["my-procurement-orders"], queryFn: listMyProcurementOrders, retry: false });
  return <PublicLayout>
    <PageHeader title="Purchases & Invoices" description="Track institutional quotes, purchase orders, invoices, and balances." />
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      {isLoading && <p className="text-muted-foreground">Loading purchases…</p>}
      {error && <AppCard padding="md"><p className="text-destructive">Purchases are unavailable until the procurement service is configured.</p></AppCard>}
      {!isLoading && !error && orders.length === 0 && <AppCard padding="md"><p>No institutional purchases yet. Request a quote from an event that accepts purchase orders.</p></AppCard>}
      {orders.map((order) => <AppCard key={order.id} padding="md" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold">{order.events?.title ?? "Institutional purchase"}</h2><p className="text-sm text-muted-foreground">{order.institution_name}</p></div>
          <div className="flex gap-2"><Badge variant="secondary">{order.procurement_status.replaceAll("_", " ")}</Badge><Badge variant="outline">{effectivePaymentStatus(order).replaceAll("_", " ")}</Badge></div>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Quote</dt><dd>{order.quote_number ?? "Pending"}</dd></div>
          <div><dt className="text-muted-foreground">PO</dt><dd>{order.po_number ?? "Awaiting PO"}</dd></div>
          <div><dt className="text-muted-foreground">Invoice</dt><dd>{order.invoice_number ?? "Not issued"}</dd></div>
          <div><dt className="text-muted-foreground">Total</dt><dd>{money(order.total_cents)}</dd></div>
          <div><dt className="text-muted-foreground">Paid</dt><dd>{money(order.paid_cents)}</dd></div>
          <div><dt className="text-muted-foreground">Balance</dt><dd className="font-bold">{money(order.total_cents - order.paid_cents)}</dd></div>
        </dl>
        <Button variant="outline" asChild><Link to="/account/purchases/$id" params={{ id: order.id }}>View purchase</Link></Button>
      </AppCard>)}
    </div>
  </PublicLayout>;
}
