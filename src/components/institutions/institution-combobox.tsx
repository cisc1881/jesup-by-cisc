import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Institution } from "@/lib/institutions";

type InstitutionComboboxProps = {
  institutions: Institution[];
  value: string;
  onValueChange: (institutionId: string) => void;
  id?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function InstitutionCombobox({
  institutions,
  value,
  onValueChange,
  id,
  placeholder = "Select your institution",
  allowEmpty = true,
  emptyLabel = "Prefer not to say",
  disabled = false,
  className,
}: InstitutionComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => institutions.find((institution) => institution.id === value) ?? null,
    [institutions, value],
  );

  const triggerLabel = selected
    ? `${selected.name}${selected.state ? ` (${selected.state})` : ""}${selected.is1890LandGrant ? " · 1890" : ""}`
    : allowEmpty && !value
      ? emptyLabel
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-10 w-full justify-between font-normal", className)}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search institutions…" />
          <CommandList>
            <CommandEmpty>No institution found.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value={emptyLabel}
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  {emptyLabel}
                </CommandItem>
              )}
              {institutions.map((institution) => {
                const label = `${institution.name}${institution.state ? ` (${institution.state})` : ""}`;
                return (
                  <CommandItem
                    key={institution.id}
                    value={`${label} ${institution.is1890LandGrant ? "1890 land-grant" : ""}`}
                    onSelect={() => {
                      onValueChange(institution.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === institution.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{label}</span>
                      {institution.is1890LandGrant && (
                        <span className="text-xs text-muted-foreground">1890 land-grant institution</span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
