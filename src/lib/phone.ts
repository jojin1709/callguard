import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

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

const numverifyCache = new Map<string, NumverifyResponse>();
const numlookupCache = new Map<string, NumlookupResponse>();
const ipqsCache = new Map<string, IpqsResponse>();

export async function fetchNumverifyData(phoneE164: string): Promise<NumverifyResponse | null> {
  const cached = numverifyCache.get(phoneE164);
  if (cached) return cached;

  const apiKey = process.env.NUMVERIFY_API_KEY;
  if (!apiKey) return null;
  const numOnly = phoneE164.replace(/\+/g, "");
  const url = `https://apilayer.net/api/validate?access_key=${apiKey}&number=${numOnly}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    if (res.ok) {
      const json = JSON.parse(text);
      if (json && typeof json.valid === "boolean") {
        numverifyCache.set(phoneE164, json as NumverifyResponse);
        return json as NumverifyResponse;
      }
    }
  } catch (err) {
    console.error("Numverify API fetch exception:", err);
  }
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
  } catch (err) {
    console.error("NumlookupAPI fetch exception:", err);
  }
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
  } catch (err) {
    console.error("IPQS API fetch exception:", err);
  }
  return null;
}

/**
 * Normalizes any user-typed phone number into E.164 format (+countrycode...).
 * Decodes URL encodings (%2B) and derives line type intelligence.
 */
export function normalizePhone(
  raw: string,
  defaultCountry: CountryCode = "IN"
) {
  let cleaned = raw.trim();
  try {
    cleaned = decodeURIComponent(cleaned).trim();
  } catch {
    // ignore decode error
  }

  if (!cleaned) return null;

  // Add + prefix if numeric string without +
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
    IN: "India",
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
  };
  return names[code] || code;
}

export const CATEGORY_LABELS: Record<string, string> = {
  SCAM: "Scam",
  TELEMARKETER: "Telemarketer",
  FRAUD: "Fraud",
  DELIVERY: "Delivery",
  BANK_FINANCE: "Bank / Finance",
  SURVEY: "Survey",
  ROBOCALL: "Robocall",
  HARASSMENT: "Harassment",
  SAFE: "Safe / Legit",
  OTHER: "Other",
};

export const SPAM_CATEGORIES = new Set([
  "SCAM",
  "TELEMARKETER",
  "FRAUD",
  "SURVEY",
  "ROBOCALL",
  "HARASSMENT",
  "OTHER",
]);
