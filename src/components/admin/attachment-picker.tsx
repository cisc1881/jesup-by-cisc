import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type AttachmentOption = {
  id: string;
  label: string;
  hint?: string | null;
};

type AttachmentPickerProps = {
  label: string;
  options: AttachmentOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export function AttachmentPicker({ label, options, selectedIds, onChange, className }: AttachmentPickerProps) {
  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <ScrollArea className="h-40 rounded-xl border border-border bg-background">
        <div className="space-y-1 p-3">
          {options.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No items available.</p>
          )}
          {options.map((option) => {
            const checked = selectedIds.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-secondary/60"
              >
                <Checkbox checked={checked} onCheckedChange={(v) => toggle(option.id, v === true)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  {option.hint && <span className="block text-xs text-muted-foreground">{option.hint}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
