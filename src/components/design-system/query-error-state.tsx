import { AlertCircle, RefreshCw } from "lucide-react";
import { AppButton } from "./app-button";
import { cn } from "@/lib/utils";

type QueryErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function QueryErrorState({
  title = "Couldn't load content",
  description = "Something went wrong while fetching data. Check your connection and try again.",
  onRetry,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-destructive/20 bg-card px-6 py-12 text-center shadow-token-soft sm:px-10",
        className,
      )}
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold tracking-[var(--tracking-tight)] text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onRetry && (
        <AppButton variant="outline" size="md" shape="pill" className="mt-6" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </AppButton>
      )}
    </div>
  );
}
