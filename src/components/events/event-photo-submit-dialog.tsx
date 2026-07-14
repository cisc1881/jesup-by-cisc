import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppButton } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitParticipantEventPhoto,
  uploadParticipantEventImage,
  validateGalleryFile,
} from "@/lib/event-gallery";
import {
  myGallerySubmissionsQueryKey,
  pendingGallerySubmissionsQueryKey,
} from "@/lib/query-config";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

type EventPhotoSubmitDialogProps = {
  eventId: string;
  eventTitle: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventPhotoSubmitDialog({
  eventId,
  eventTitle,
  userId,
  open,
  onOpenChange,
}: EventPhotoSubmitDialogProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select an image to upload.");
      if (!permissionConfirmed) throw new Error("Permission confirmation is required.");
      const imageUrl = await uploadParticipantEventImage(eventId, file);
      return submitParticipantEventPhoto({
        eventId,
        imageUrl,
        caption,
        altText,
        hasPermissionConfirmed: true,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myGallerySubmissionsQueryKey(userId) });
      void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey(eventId) });
      void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey() });
      setSubmitted(true);
      setStatusMessage("Your photo was submitted and is pending review.");
      toast.success("Photo submitted for review");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Submission failed";
      setStatusMessage(message);
      toast.error(message);
    },
  });

  function resetForm() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    setAltText("");
    setPermissionConfirmed(false);
    setValidationError(null);
    setStatusMessage("");
    setSubmitted(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleFile(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    const error = validateGalleryFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setValidationError(error);
    setStatusMessage(error ?? "Image selected.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a photo — {eventTitle}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Thank you! Your photo has been submitted and will be reviewed before it may appear in the public gallery.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
          >
            <div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {file ? "Change image" : "Choose image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={["image/jpeg", "image/png", "image/webp", "image/gif"].join(",")}
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {previewUrl && (
              <img src={previewUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            )}

            {validationError && <p className="text-sm text-destructive">{validationError}</p>}

            <div>
              <Label htmlFor="photo-caption">Caption</Label>
              <Textarea
                id="photo-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="photo-alt">Alt text (optional)</Label>
              <Input
                id="photo-alt"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="photo-permission"
                checked={permissionConfirmed}
                onCheckedChange={(v) => setPermissionConfirmed(v === true)}
              />
              <Label htmlFor="photo-permission" className="text-sm leading-snug">
                I have permission to share this image and understand it may be reviewed before public display.
              </Label>
            </div>

            <div aria-live="polite" className="text-sm text-muted-foreground">
              {statusMessage}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitMutation.isPending ||
                  !file ||
                  !!validationError ||
                  !permissionConfirmed
                }
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit photo"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type EventPhotoSubmitButtonProps = {
  eventId: string;
  eventTitle: string;
  userId: string;
};

export function EventPhotoSubmitButton({ eventId, eventTitle, userId }: EventPhotoSubmitButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppButton variant="outline" shape="pill" onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" />
        Share a photo
      </AppButton>
      <EventPhotoSubmitDialog
        eventId={eventId}
        eventTitle={eventTitle}
        userId={userId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
