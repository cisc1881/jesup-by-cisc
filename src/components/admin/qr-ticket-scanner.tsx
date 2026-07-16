import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QrTicketScanner({
  disabled,
  onDetected,
}: {
  disabled?: boolean;
  onDetected: (code: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    let cancelled = false;
    detectedRef.current = false;
    const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });

    void reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => {
          if (!result || detectedRef.current) return;
          detectedRef.current = true;
          controlsRef.current?.stop();
          setOpen(false);
          void onDetected(result.getText());
        },
      )
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setOpen(false);
        toast.error(error instanceof Error ? error.message : "Camera access is unavailable.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetected, open]);

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen((value) => !value)}>
        {open ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
        {open ? "Stop scanner" : "Scan QR code"}
      </Button>
      {open && (
        <div className="max-w-md overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          <p className="bg-black p-2 text-center text-xs text-white">Center the attendee QR code in the camera.</p>
        </div>
      )}
    </div>
  );
}

