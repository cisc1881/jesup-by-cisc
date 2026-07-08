import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({ component: () => (
  <PublicLayout>
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <span className="gold-bar mx-auto mb-4" />
      <h1 className="font-serif text-3xl font-bold text-primary">Access denied</h1>
      <p className="mt-2 text-muted-foreground">You need admin permission to view this page.</p>
      <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
    </div>
  </PublicLayout>
)});
