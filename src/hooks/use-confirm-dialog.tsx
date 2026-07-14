import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UseConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmDialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  function confirm(next: UseConfirmDialogOptions) {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }

  function finish(value: boolean) {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
  }

  const dialog = options ? (
    <AlertDialog open={open} onOpenChange={(v) => !v && finish(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>{options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => finish(false)}>
            {options.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={options.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={() => finish(true)}
          >
            {options.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return { confirm, dialog };
}
