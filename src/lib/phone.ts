import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { lookupLocalSpamDB, type LocalSpamResult } from "./local-spam-db";

export type LineTypeIntelligence = {
  lineType: "mobile" | "landline" | "voip" | "toll_free" | "unknown";
  carrierName: string;
  isVoip: boolean;
  isLandline: boolean;
  countryName: string;
};

export type NumverifyResponse = {
  valid: boolean;
  number: string;
  local_format: string;
  international_format: string;
  country_prefix: string;
  country_code: string;
  country_name: string;
  location: string | null;
  carrier: string | null;
  line_type: string | null;
};

export type NumlookupResponse = {
  valid: boolean;
  number: string;
  local_format: string;
  international_format: string;
  country_prefix: string;
  country_code: string;
  country_name: string;
  location: string | null;
  carrier: string | null;
  line_type: string | null;
};

export type IpqsResponse = {
  success: boolean;
  message?: string;
  formatted?: string;
  local_format?: string;
  valid?: boolean;
  fraud_score?: number;
  recent_abuse?: boolean;
  VOIP?: boolean;
  prepaid?: boolean;
  risky?: boolean;
  active?: boolean;
  name?: string | null;
  carrier?: string | null;
  line_type?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  timezone?: string | null;
  zip_code?: string | null;
  spammer?: boolean;
  active_status?: string | null;
  tcpa_blacklist?: boolean;
  do_not_call?: boolean;
  leaked?: boolean;
  user_activity?: string | null;
  sms_pumping?: {
    risk_score?: number;
    message?: string;
    velocity?: string;
  };
};

export type FreeCnamResponse = {
  cnam: string | null;
};

export type NeutrinoPhoneValidateResponse = {
  valid: boolean;
  type: string;
  "international-number": string;
  "local-number": string;
  "international-calling-code": string;
  country: string;
  "country-code": string;
  "country-code3": string;
  location: string;
  "is-mobile": boolean;
  "currency-code": string;
  "prefix-network": string;
};

export type NeutrinoHlrResponse = {
  "number-valid": boolean;
  "hlr-valid": boolean;
  "hlr-status": string;
  "is-mobile": boolean;
  "is-ported": boolean;
  "is-roaming": boolean;
  "number-type": string;
  "current-network": string;
  "origin-network": string;
  "ported-network": string;
  "network-tags": string;
  location: string;
  country: string;
  "country-code": string;
  "country-code3": string;
  "international-number": string;
  "local-number": string;
  "international-calling-code": string;
  "currency-code": string;
  "roaming-country-code": string;
  imsi: string;
  mcc: string;
  mnc: string;
};

const numverifyCache = new Map<string, NumverifyResponse>();
const numlookupCache = new Map<string, NumlookupResponse>();
const ipqsCache = new Map<string, IpqsResponse>();
const freeCnamCache = new Map<string, FreeCnamResponse>();
const neutrinoValidateCache = new Map<string, NeutrinoPhoneValidateResponse>();
const neutrinoHlrCache = new Map<string, NeutrinoHlrResponse>();

function neutrinoHeaders(): Record<string, string> {
  const userId = process.env.NEUTRINO_API_USER_ID;
  const apiKey = process.env.NEUTRINO_API_KEY;
  if (!userId || !apiKey) return {};
  return { "User-ID": userId, "API-Key": apiKey };
}

function isNeutrinoConfigured(): boolean {
  return !!(process.env.NEUTRINO_API_USER_ID && process.env.NEUTRINO_API_KEY);
}

export async function fetchNumverifyData(phoneE164: string): Promise<NumverifyResponse | null> {
  const cached = numverifyCache.get(phoneE164);
  if (cached) return cached;
  const apiKey = process.env.NUMVERIFY_API_KEY;
  if (!apiKey) return null;
  const numOnly = phoneE164.replace(/\+/g, "");
  const url = `https://apilayer.net/api/validate?access_key=${apiKey}&number=${numOnly}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json.valid === "boolean") {
        numverifyCache.set(phoneE164, json as NumverifyResponse);
        return json as NumverifyResponse;
      }
    }
  } catch (err) { console.error("Numverify error:", err); }
  return null;
}

export async function fetchNumlookupData(phoneE164: string): Promise<NumlookupResponse | null> {
  const cached = numlookupCache.get(phoneE164);
  if (cached) return cached;
  const apiKey = process.env.NUMLOOKUP_API_KEY;
  if (!apiKey) return null;
  const url = `https://api.numlookupapi.com/v1/validate/${encodeURIComponent(phoneE164)}?apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json.valid === "boolean") {
        numlookupCache.set(phoneE164, json as NumlookupResponse);
        return json as NumlookupResponse;
      }
    }
  } catch (err) { console.error("Numlookup error:", err); }
  return null;
}

export async function fetchIpqsData(phoneE164: string): Promise<IpqsResponse | null> {
  const cached = ipqsCache.get(phoneE164);
  if (cached) return cached;
  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.ipqualityscore.com/api/json/phone/${apiKey}/${encodeURIComponent(phoneE164)}?strictness=1`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json.success === "boolean") {
        ipqsCache.set(phoneE164, json as IpqsResponse);
        return json as IpqsResponse;
      }
    }
  } catch (err) { console.error("IPQS error:", err); }
  return null;
}

export async function fetchFreeCnamData(phoneE164: string): Promise<FreeCnamResponse | null> {
  const cached = freeCnamCache.get(phoneE164);
  if (cached) return cached;
  const numOnly = phoneE164.replace(/\D/g, "");
  if (numOnly.length !== 10 && numOnly.length !== 11) return null;
  const query = numOnly.length === 11 ? numOnly.slice(1) : numOnly;
  const url = `https://freecnam.org/dip?q=${query}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed && trimmed !== "NO DATA" && trimmed !== "NOT FOUND") {
        const result: FreeCnamResponse = { cnam: trimmed.slice(0, 15) };
        freeCnamCache.set(phoneE164, result);
        return result;
      }
    }
  } catch (err) { console.error("FreeCNAM error:", err); }
  return null;
}

export async function fetchNeutrinoValidate(phoneE164: string): Promise<NeutrinoPhoneValidateResponse | null> {
  const cached = neutrinoValidateCache.get(phoneE164);
  if (cached) return cached;
  if (!isNeutrinoConfigured()) return null;
  const url = "https://neutrinoapi.net/phone-validate";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...neutrinoHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ number: phoneE164 }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json.valid === "boolean") {
        neutrinoValidateCache.set(phoneE164, json as NeutrinoPhoneValidateResponse);
        return json as NeutrinoPhoneValidateResponse;
      }
    }
  } catch (err) { console.error("Neutrino validate error:", err); }
  return null;
}

export async function fetchNeutrinoHlr(phoneE164: string): Promise<NeutrinoHlrResponse | null> {
  const cached = neutrinoHlrCache.get(phoneE164);
  if (cached) return cached;
  if (!isNeutrinoConfigured()) return null;
  const url = "https://neutrinoapi.net/hlr-lookup";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...neutrinoHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ number: phoneE164 }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json["number-valid"] === "boolean") {
        neutrinoHlrCache.set(phoneE164, json as NeutrinoHlrResponse);
        return json as NeutrinoHlrResponse;
      }
    }
  } catch (err) { console.error("Neutrino HLR error:", err); }
  return null;
}

export function normalizePhone(
  raw: string,
  defaultCountry: CountryCode = "IN"
) {
  let cleaned = raw.trim();
  try { cleaned = decodeURIComponent(cleaned).trim(); } catch {}
  if (!cleaned) return null;
  if (!cleaned.startsWith("+") && /^\d+$/.test(cleaned.replace(/\s+/g, ""))) {
    cleaned = `+${cleaned.replace(/\s+/g, "")}`;
  }
  const parsed = cleaned.startsWith("+")
    ? parsePhoneNumberFromString(cleaned)
    : parsePhoneNumberFromString(cleaned, defaultCountry);
  if (!parsed) return null;
  const rawType = parsed.getType();
  let lineType: LineTypeIntelligence["lineType"] = "mobile";
  if (rawType === "FIXED_LINE") lineType = "landline";
  else if (rawType === "TOLL_FREE") lineType = "toll_free";
  else if (rawType === "VOIP") lineType = "voip";
  else if (rawType === "MOBILE" || rawType === "FIXED_LINE_OR_MOBILE") lineType = "mobile";
  else lineType = "unknown";
  const country = parsed.country ?? "IN";
  return {
    e164: parsed.number,
    country,
    valid: parsed.isValid(),
    lineTypeIntelligence: {
      lineType,
      carrierName: `${getCountryName(country)} Telecom Network`,
      isVoip: lineType === "voip",
      isLandline: lineType === "landline",
      countryName: getCountryName(country),
    },
  };
}

export function formatForDisplay(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    IN: "India", US: "United States", GB: "United Kingdom", CA: "Canada",
    AU: "Australia", DE: "Germany", FR: "France",
  };
  return names[code] || code;
}

export const CATEGORY_LABELS: Record<string, string> = {
  SCAM: "Scam", TELEMARKETER: "Telemarketer", FRAUD: "Fraud",
  DELIVERY: "Delivery", BANK_FINANCE: "Bank / Finance", SURVEY: "Survey",
  ROBOCALL: "Robocall", HARASSMENT: "Harassment", SAFE: "Safe / Legit", OTHER: "Other",
};

export const SPAM_CATEGORIES = new Set([
  "SCAM", "TELEMARKETER", "FRAUD", "SURVEY", "ROBOCALL", "HARASSMENT", "OTHER",
]);

export async function lookupWithLocalDB(phoneE164: string): Promise<{
  localSpam: LocalSpamResult;
  numverify: NumverifyResponse | null;
  numlookup: NumlookupResponse | null;
  ipqs: IpqsResponse | null;
  freeCnam: FreeCnamResponse | null;
  neutrinoValidate: NeutrinoPhoneValidateResponse | null;
  neutrinoHlr: NeutrinoHlrResponse | null;
  combinedSpamScore: number;
  callerName: string | null;
  carrierName: string | null;
  lineType: string | null;
  isRoaming: boolean;
  isPorted: boolean;
}> {
  const [localSpam, numverify, numlookup, ipqs, freeCnam, neutrinoValidate] = await Promise.all([
    lookupLocalSpamDB(phoneE164),
    fetchNumverifyData(phoneE164),
    fetchNumlookupData(phoneE164),
    fetchIpqsData(phoneE164),
    fetchFreeCnamData(phoneE164),
    fetchNeutrinoValidate(phoneE164),
  ]);

  let neutrinoHlr: NeutrinoHlrResponse | null = null;
  if (neutrinoValidate?.valid && neutrinoValidate.type === "mobile") {
    neutrinoHlr = await fetchNeutrinoHlr(phoneE164);
  }

  let combinedSpamScore = localSpam.spamScore;
  if (ipqs?.fraud_score && ipqs.fraud_score > combinedSpamScore) combinedSpamScore = ipqs.fraud_score;
  if (ipqs?.spammer) combinedSpamScore = Math.max(combinedSpamScore, 85);
  if (ipqs?.VOIP) combinedSpamScore = Math.max(combinedSpamScore, 30);
  if (ipqs?.recent_abuse) combinedSpamScore = Math.max(combinedSpamScore, 60);
  if (ipqs?.risky) combinedSpamScore = Math.max(combinedSpamScore, 50);

  const callerName = freeCnam?.cnam || ipqs?.name || null;
  const carrierName = neutrinoHlr?.["current-network"] || ipqs?.carrier || numverify?.carrier || numlookup?.carrier || neutrinoValidate?.["prefix-network"] || null;
  const lineType = neutrinoHlr?.["number-type"] || neutrinoValidate?.type || ipqs?.line_type || numverify?.line_type || numlookup?.line_type || null;

  return {
    localSpam, numverify, numlookup, ipqs, freeCnam,
    neutrinoValidate, neutrinoHlr,
    combinedSpamScore, callerName, carrierName, lineType,
    isRoaming: neutrinoHlr?.["is-roaming"] || false,
    isPorted: neutrinoHlr?.["is-ported"] || false,
  };
}
