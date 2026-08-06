import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

function neutrinoHeaders(): Record<string, string> {
  const userId = process.env.NEUTRINO_API_USER_ID;
  const apiKey = process.env.NEUTRINO_API_KEY;
  if (!userId || !apiKey) return {};
  return { "User-ID": userId, "API-Key": apiKey };
}

const schema = z.object({
  domain: z.string().min(1, "Domain is required."),
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`domain-lookup-${ip}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({ domain: searchParams.get("domain") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (!process.env.NEUTRINO_API_USER_ID || !process.env.NEUTRINO_API_KEY) {
    return NextResponse.json({ error: "Domain lookup not configured." }, { status: 503 });
  }

  try {
    const res = await fetch("https://neutrinoapi.net/domain-lookup", {
      method: "POST",
      headers: { ...neutrinoHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ host: parsed.data.domain, live: "true" }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Domain lookup failed." }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      status: 200,
      data: {
        domain: data.domain,
        valid: data.valid,
        "is-malicious": data["is-malicious"],
        "is-adult": data["is-adult"],
        "is-gov": data["is-gov"],
        rank: data.rank,
        age: data.age,
        "registered-date": data["registered-date"],
        "expiry-date": data["expiry-date"],
        registrar: data["registrar-name"],
        tld: data.tld,
        "dns-provider": data["dns-provider"],
        "mail-provider": data["mail-provider"],
        "mail-status": data["mail-status"],
        "website-provider": data["website-provider"],
        "website-status": data["website-status"],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Domain lookup failed." }, { status: 500 });
  }
}
