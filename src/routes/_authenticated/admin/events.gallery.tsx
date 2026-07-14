import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const gallerySearchSchema = z.object({
  eventId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/events/gallery")({
  validateSearch: gallerySearchSchema,
});
