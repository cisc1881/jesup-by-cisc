import { describe, expect, it } from "vitest";
import { findBuiltinVerifiedCounty } from "@/lib/weather/county-directory";
import { isPublicCountyRecord, mapCountyRecordToPreparedness } from "@/lib/weather/county-directory-service";

describe("county verified lookup", () => {
  it("returns built-in Macon County verified record", () => {
    const record = findBuiltinVerifiedCounty("Macon County", "AL");
    expect(record?.primaryPhone).toBe("334-724-2626");
    expect(record?.verificationStatus).toBe("verified");
  });

  it("maps verified records to public preparedness cards with phone", () => {
    const record = findBuiltinVerifiedCounty("Macon County", "AL");
    expect(record).not.toBeNull();
    const card = mapCountyRecordToPreparedness(record!);
    expect(card.contactAvailable).toBe(true);
    expect(card.phone).toBe("334-724-2626");
    expect(card.verificationStatus).toBe("verified");
  });
});

describe("generic fallback", () => {
  it("returns generic guidance without phone for unknown counties", () => {
    const record = findBuiltinVerifiedCounty("Jefferson County", "AL");
    expect(record).toBeNull();
    const card = mapCountyRecordToPreparedness({
      id: "generic",
      countyName: "Jefferson County",
      stateName: "Alabama",
      stateCode: "AL",
      agencyName: "Local emergency management",
      primaryPhone: null,
      alternatePhone: null,
      websiteUrl: null,
      alertSignupUrl: null,
      shelterInfoUrl: null,
      weatherRadioGuidance: null,
      emergencyKitGuidance: null,
      householdStormProtocol: null,
      sourceName: null,
      sourceUrl: null,
      verifiedDate: null,
      verificationStatus: "pending",
      notes: null,
      isActive: true,
      archivedAt: null,
      createdAt: "",
      updatedAt: "",
    });
    expect(card.contactAvailable).toBe(false);
    expect(card.phone).toBeNull();
    expect(card.verificationStatus).toBe("generic");
  });
});

describe("public visibility rules", () => {
  it("excludes pending and archived records from public visibility", () => {
    expect(
      isPublicCountyRecord({
        id: "1",
        countyName: "Macon County",
        stateName: "Alabama",
        stateCode: "AL",
        agencyName: "EMA",
        primaryPhone: "334-724-2626",
        alternatePhone: null,
        websiteUrl: null,
        alertSignupUrl: null,
        shelterInfoUrl: null,
        weatherRadioGuidance: null,
        emergencyKitGuidance: null,
        householdStormProtocol: null,
        sourceName: "EMA",
        sourceUrl: null,
        verifiedDate: "2026-07-12",
        verificationStatus: "pending",
        notes: null,
        isActive: true,
        archivedAt: null,
        createdAt: "",
        updatedAt: "",
      }),
    ).toBe(false);

    expect(
      isPublicCountyRecord({
        id: "2",
        countyName: "Macon County",
        stateName: "Alabama",
        stateCode: "AL",
        agencyName: "EMA",
        primaryPhone: "334-724-2626",
        alternatePhone: null,
        websiteUrl: null,
        alertSignupUrl: null,
        shelterInfoUrl: null,
        weatherRadioGuidance: null,
        emergencyKitGuidance: null,
        householdStormProtocol: null,
        sourceName: "EMA",
        sourceUrl: null,
        verifiedDate: "2026-07-12",
        verificationStatus: "verified",
        notes: null,
        isActive: false,
        archivedAt: "2026-07-12",
        createdAt: "",
        updatedAt: "",
      }),
    ).toBe(false);
  });
});
