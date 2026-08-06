import { NextRequest, NextResponse } from "next/server";
import { checkSmsSpamKeywords } from "@/lib/local-spam-db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().min(1, "SMS text is required.").max(1000, "Text too long."),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`sms-check-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const result = await checkSmsSpamKeywords(parsed.data.text);

  return NextResponse.json({
    status: 200,
    data: {
      isSpam: result.isSpam,
      category: result.category,
      matchedKeywords: result.matchedKeywords,
      riskLevel: result.isSpam ? (result.category === "phishing" || result.category === "scam" ? "high" : "medium") : "low",
    },
  });
}
