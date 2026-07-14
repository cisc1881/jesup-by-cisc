import { toast } from "sonner";
import { toastActionError } from "@/lib/seo";
import { useConfirmDialog } from "./use-confirm-dialog";

type AdminDeleteOptions = {
  entityLabel: string;
  itemName: string;
  description?: string;
  onDelete: () => Promise<void>;
  onSuccess?: () => void;
};

export function useAdminDelete() {
  const { confirm, dialog } = useConfirmDialog();

  async function confirmAndDelete({
    entityLabel,
    itemName,
    description,
    onDelete,
    onSuccess,
  }: AdminDeleteOptions) {
    const ok = await confirm({
      title: `Delete ${entityLabel}?`,
      description: description ?? `"${itemName}" will be permanently removed from JESUP.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return false;
    try {
      await onDelete();
      toast.success(`Deleted "${itemName}"`);
      onSuccess?.();
      return true;
    } catch (err) {
      toastActionError(`Delete ${entityLabel.toLowerCase()}`, err);
      return false;
    }
  }

  return { confirmAndDelete, dialog };
}
