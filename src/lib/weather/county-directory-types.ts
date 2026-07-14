/** County emergency directory model — Sprint 10 Phase 3. */

export type CountyVerificationStatus = "verified" | "pending" | "generic";

export interface CountyEmergencyRecord {
  id: string;
  countyName: string;
  stateName: string;
  stateCode: string;
  agencyName: string;
  primaryPhone: string | null;
  alternatePhone: string | null;
  websiteUrl: string | null;
  alertSignupUrl: string | null;
  shelterInfoUrl: string | null;
  weatherRadioGuidance: string | null;
  emergencyKitGuidance: string | null;
  householdStormProtocol: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedDate: string | null;
  verificationStatus: CountyVerificationStatus;
  notes: string | null;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CountyEmergencyFormData = {
  countyName: string;
  stateName: string;
  stateCode: string;
  agencyName: string;
  primaryPhone: string;
  alternatePhone: string;
  websiteUrl: string;
  alertSignupUrl: string;
  shelterInfoUrl: string;
  weatherRadioGuidance: string;
  emergencyKitGuidance: string;
  householdStormProtocol: string;
  sourceName: string;
  sourceUrl: string;
  verifiedDate: string;
  verificationStatus: CountyVerificationStatus;
  notes: string;
  isActive: boolean;
};

export type CountyEmergencyListItem = Pick<
  CountyEmergencyRecord,
  | "id"
  | "countyName"
  | "stateName"
  | "stateCode"
  | "agencyName"
  | "primaryPhone"
  | "verificationStatus"
  | "verifiedDate"
  | "isActive"
  | "archivedAt"
  | "updatedAt"
>;
