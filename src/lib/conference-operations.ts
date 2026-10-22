import { z } from 'zod';

export const productKinds = ['ticket','meal','activity','parking','sponsor_package','company_package'] as const;
export const staffRoles = ['checkin','redemption','badge','manager'] as const;
export const productInput = z.object({
  id: z.string().uuid().optional(), event_id: z.string().uuid(), name: z.string().trim().min(1).max(160),
  kind: z.enum(productKinds), beneficiary: z.enum(['self','guest','company']),
  description: z.string().max(2000).nullable(), price_cents: z.number().int().min(0).nullable(),
  capacity: z.number().int().min(0).nullable(), currency: z.literal('USD'), is_active: z.boolean(),
});
export const issueInput = z.object({ eventId:z.string().uuid(), productId:z.string().uuid(), registrationId:z.string().uuid(), quantity:z.number().int().min(1).max(1000), beneficiaryName:z.string().max(160), requestId:z.string().uuid(), allowUnpriced:z.boolean() });
export const operationInput = z.object({ eventId:z.string().uuid(), operation:z.enum(['checkin','redemption','badge','meal']), code:z.string().trim().min(6).max(256), requestId:z.string().uuid(), mealDayId:z.string().uuid().nullable() });
export function canIssueProduct(priceCents:number|null, isAdmin:boolean, explicitlyApproved:boolean) {
  return isAdmin && (priceCents !== null && Number.isInteger(priceCents) && priceCents >= 0 || explicitlyApproved && priceCents === null);
}
export function checkoutEnabled() { return false; }
