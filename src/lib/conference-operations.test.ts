import {describe,it,expect} from 'vitest';
import {canIssueProduct,checkoutEnabled,issueInput,operationInput,productInput,productKinds} from './conference-operations';
const eventId='4a1ae1f9-65ff-45ca-98cb-dd8ea2d41a18';
describe('Conference issuance rules',()=>{
 it('never enables checkout or Square payments',()=>expect(checkoutEnabled()).toBe(false));
 it('rejects non-admin issuance even with approval',()=>expect(canIssueProduct(null,false,true)).toBe(false));
 it('requires explicit approval for unpriced admin issuance',()=>{expect(canIssueProduct(null,true,false)).toBe(false);expect(canIssueProduct(null,true,true)).toBe(true)});
 it('accepts explicitly priced free products for admins',()=>expect(canIssueProduct(0,true,false)).toBe(true));
 it('rejects negative product prices',()=>expect(productInput.safeParse({event_id:eventId,name:'Meal',kind:'meal',beneficiary:'guest',description:null,price_cents:-1,capacity:null,currency:'USD',is_active:true}).success).toBe(false));
 it('supports all requested product categories',()=>expect(productKinds).toEqual(['ticket','meal','activity','parking','sponsor_package','company_package']));
 it('requires a one-time request identifier for issuance',()=>expect(issueInput.safeParse({eventId,productId:eventId,registrationId:eventId,quantity:1,beneficiaryName:'',allowUnpriced:true}).success).toBe(false));
 it('rejects unknown staff operations',()=>expect(operationInput.safeParse({eventId,operation:'sell',code:'abcdef',requestId:eventId,mealDayId:null}).success).toBe(false));
});
