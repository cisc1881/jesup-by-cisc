import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { issueInput, operationInput, productInput, staffRoles } from './conference-operations';

const eventInput = z.object({ eventId:z.string().uuid(), wallet:z.boolean().optional() });
export const conferenceWorkspace = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(eventInput).handler(async ({data,context}) => {
  const db = context.supabase;
  const {data:admin,error:roleError} = await db.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(roleError) throw roleError;
  const permissions = await Promise.all(['checkin','redemption','badge'].map(async operation => {
    const {data:allowed,error} = await db.rpc('can_operate_event',{p_event_id:data.eventId,p_operation:operation});
    if(error) throw error;
    return {operation,allowed:Boolean(allowed)};
  }));
  const [products,entitlements,registrations,staff,sellers,audit,meals] = await Promise.all([
    db.from('event_products').select('*').eq('event_id',data.eventId).order('sort_order'),
    data.wallet ? db.from('event_entitlements').select('*,event_products(name,kind,beneficiary),event_entitlement_redemptions(id),event_registrations!inner(user_id)').eq('event_id',data.eventId).eq('event_registrations.user_id',context.userId).order('created_at',{ascending:false}) : db.from('event_entitlements').select('*,event_products(name,kind,beneficiary),event_entitlement_redemptions(id)').eq('event_id',data.eventId).order('created_at',{ascending:false}),
    data.wallet ? db.from('event_registrations').select('id,attendee_name,status,user_id').eq('event_id',data.eventId).eq('user_id',context.userId) : db.from('event_registrations').select('id,attendee_name,status,user_id').eq('event_id',data.eventId),
    db.from('event_staff_assignments').select('*').eq('event_id',data.eventId),
    admin ? db.from('event_seller_connections').select('*').eq('event_id',data.eventId) : Promise.resolve({data:[],error:null}),
    admin ? db.from('event_operation_audit').select('id,operation,actor_id,created_at,registration_id,entitlement_id').eq('event_id',data.eventId).order('created_at',{ascending:false}).limit(50) : Promise.resolve({data:[],error:null}),
    db.from('event_meal_days').select('id,label,service_date,is_active').eq('event_id',data.eventId).eq('is_active',true),
  ]);
  for(const result of [products,entitlements,registrations,staff,sellers,audit,meals]) if(result.error) throw result.error;
  return {admin:Boolean(admin),permissions,products:products.data??[],entitlements:entitlements.data??[],registrations:registrations.data??[],staff:staff.data??[],sellers:sellers.data??[],audit:audit.data??[],meals:meals.data??[]};
});

const configInput = z.discriminatedUnion('action',[
 z.object({action:z.literal('product'),value:productInput}),
 z.object({action:z.literal('staff'),value:z.object({event_id:z.string().uuid(),user_id:z.string().uuid(),staff_role:z.enum(staffRoles),is_active:z.boolean()})}),
 z.object({action:z.literal('seller'),value:z.object({event_id:z.string().uuid(),merchant_id:z.string().max(100).nullable(),location_id:z.string().max(100).nullable(),application_id:z.string().max(100).nullable(),application_fee_bps:z.number().int().min(0).max(10000).nullable(),application_fee_cents:z.number().int().min(0).nullable()})}),
]);
export const saveConferenceConfiguration = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(configInput).handler(async ({data,context}) => {
 const {data:admin,error} = await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(error || !admin) throw new Error('Administrator required');
 if(data.action==='product') {
  const {error} = await context.supabase.from('event_products').upsert(data.value);
  if(error) throw error;
 } else if(data.action==='staff') {
  const {error} = await context.supabase.from('event_staff_assignments').upsert(data.value,{onConflict:'event_id,user_id,staff_role'});
  if(error) throw error;
 } else {
  const {error} = await context.supabase.from('event_seller_connections').upsert({...data.value,provider:'square',environment:'sandbox',status:'disabled',live_payments_enabled:false},{onConflict:'event_id'});
  if(error) throw error;
 }
 return {saved:true};
});
export const issueConferenceCredential = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(issueInput).handler(async ({data,context}) => {
 const {data:id,error} = await context.supabase.rpc('issue_event_entitlement',{p_event_id:data.eventId,p_product_id:data.productId,p_registration_id:data.registrationId,p_quantity:data.quantity,p_beneficiary_name:data.beneficiaryName,p_request_id:data.requestId,p_allow_unpriced:data.allowUnpriced});
 if(error) throw new Error(error.message); return id;
});
export const revokeConferenceCredential = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data,context}) => {
 const {error} = await context.supabase.rpc('revoke_event_entitlement',{p_id:data.id}); if(error) throw new Error(error.message); return {revoked:true};
});
export const claimConferenceRegistration = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({eventId:z.string().uuid(),credential:z.string().trim().min(6).max(256)})).handler(async ({data,context}) => {
 const {data:id,error} = await context.supabase.rpc('claim_eventbrite_registration',{p_event_id:data.eventId,p_credential:data.credential});
 if(error) throw new Error('Ticket could not be linked. Use the original Eventbrite barcode and the same verified email, or contact the event team.');
 return id;
});
export const operateConferenceCredential = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(operationInput).handler(async ({data,context}) => {
 const {data:result,error} = await context.supabase.rpc('operate_event_credential',{p_event_id:data.eventId,p_operation:data.operation,p_code:data.code,p_request_id:data.requestId,p_meal_day_id:data.mealDayId ?? undefined});
 if(error) throw new Error(error.message); return result;
});
