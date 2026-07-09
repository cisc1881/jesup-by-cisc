import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Plus } from "lucide-react";

export function CommandCenterPageHeader({
  title,
  description,
  searchValue,
  onSearchChange,
  onExport,
  onNew,
  actions,
}: {
  title: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onExport?: () => void;
  onNew?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="gold-bar mb-2" />
          <h1 className="font-serif text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <Input
              placeholder="Search…"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-56"
            />
          )}
          {actions}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          )}
          {onNew && (
            <Button className="bg-primary hover:bg-primary/90" onClick={onNew}>
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Content area wrapper for Command Center pages. */
export function CommandCenterContentShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl">{children}</div>;
}

/** @deprecated Use CommandCenterPageHeader */
export const AdminPageHeader = CommandCenterPageHeader;

/** @deprecated Use CommandCenterContentShell */
export const AdminShell = CommandCenterContentShell;
