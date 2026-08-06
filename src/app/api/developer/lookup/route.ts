import { NextResponse } from "next/server";
import { normalizePhone, fetchNumlookupData, fetchIpqsData } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
  api_key: z.string().min(1, "API key is required."),
});

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`dev-api-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = lookupSchema.safeParse({
    phone: searchParams.get("phone"),
    api_key: searchParams.get("api_key"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { phone, api_key } = parsed.data;

  const validApiKeys = (process.env.DEVELOPER_API_KEYS || "").split(",").filter(Boolean);
  if (validApiKeys.length === 0 || !validApiKeys.includes(api_key)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
  }

  const [numlookup, ipqs] = await Promise.all([
    fetchNumlookupData(normalized.e164),
    fetchIpqsData(normalized.e164),
  ]);

  return NextResponse.json({
    status: 200,
    data: {
      e164: normalized.e164,
      valid: numlookup?.valid || ipqs?.valid || normalized.valid,
      carrier: numlookup?.carrier || ipqs?.carrier || normalized.lineTypeIntelligence.carrierName,
      location: numlookup?.location || [ipqs?.city, ipqs?.region].filter(Boolean).join(", ") || normalized.lineTypeIntelligence.countryName,
      lineType: numlookup?.line_type || ipqs?.line_type || normalized.lineTypeIntelligence.lineType,
      fraudScore: ipqs?.fraud_score ?? 0,
      isVoip: ipqs?.VOIP ?? normalized.lineTypeIntelligence.isVoip,
      isPrepaid: ipqs?.prepaid ?? false,
      tcpaBlacklist: ipqs?.tcpa_blacklist ?? false,
      callerName: ipqs?.name && ipqs.name !== "N/A" ? ipqs.name : null,
    },
  });
}
