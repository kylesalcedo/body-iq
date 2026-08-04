/**
 * Clinician credential verification via the public NPPES NPI Registry.
 * https://npiregistry.cms.hhs.gov/api-page — free, no auth.
 *
 * Given an NPI (National Provider Identifier), confirm it's an active provider
 * whose taxonomy is a licensed movement/rehab clinician (PT, OT, DC, ATC, or a
 * physician). Returns the registry name + credential + taxonomy — never stores
 * or exposes more than needed.
 *
 * NOTE: NPI is public data, so an NPI alone proves the number exists, not that
 * the caller *is* that person. Pair this with an identity step (name match at
 * signup + a verification email) before granting sign-off rights.
 */

const NPPES = "https://npiregistry.cms.hhs.gov/api/";

// Allowed primary taxonomies (by NPPES `desc` keyword). Physicians are matched
// by code prefix "20" (allopathic/osteopathic) below.
const ALLOWED_DESC = [
  "Physical Therapist",
  "Occupational Therapist",
  "Chiropractor",
  "Athletic Trainer",
  "Physician Assistant",
  "Nurse Practitioner",
  "Kinesiotherapist",
];

export type NpiResult =
  | { verified: true; npi: string; name: string; credential: string | null; taxonomy: string; taxonomyCode: string }
  | { verified: false; reason: string };

function eligibleTaxonomy(t: { desc?: string; code?: string; primary?: boolean }): boolean {
  const desc = t.desc ?? "";
  if (ALLOWED_DESC.some((d) => desc.includes(d))) return true;
  // allopathic / osteopathic physicians: taxonomy codes start with "20"
  if ((t.code ?? "").startsWith("20") && /physician|medic|osteopath|allopath/i.test(desc)) return true;
  return false;
}

export async function verifyNpi(npiRaw: string): Promise<NpiResult> {
  const npi = String(npiRaw).trim();
  if (!/^\d{10}$/.test(npi)) return { verified: false, reason: "NPI must be 10 digits." };

  const url = `${NPPES}?version=2.1&number=${npi}`;
  let json: any;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { verified: false, reason: `NPPES lookup failed (${res.status}).` };
    json = await res.json();
  } catch {
    return { verified: false, reason: "Could not reach the NPI registry — try again." };
  }

  const rec = json?.results?.[0];
  if (!rec) return { verified: false, reason: "No provider found for that NPI." };
  if (rec.enumeration_type === "NPI-2") return { verified: false, reason: "That's an organization NPI — use your individual (Type 1) NPI." };

  const taxonomies: any[] = rec.taxonomies ?? [];
  const match = taxonomies.find((t) => t.primary && eligibleTaxonomy(t)) ?? taxonomies.find(eligibleTaxonomy);
  if (!match) {
    const primary = taxonomies.find((t) => t.primary)?.desc ?? "unknown";
    return { verified: false, reason: `That NPI is a ${primary}, which isn't an eligible clinician type for sign-off.` };
  }

  const b = rec.basic ?? {};
  const name = rec.enumeration_type === "NPI-2"
    ? (b.organization_name ?? "Organization")
    : [b.first_name, b.last_name].filter(Boolean).join(" ") || "Provider";

  return { verified: true, npi, name, credential: b.credential ?? null, taxonomy: match.desc, taxonomyCode: match.code };
}
