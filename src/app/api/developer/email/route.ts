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
  email: z.string().email("Invalid email address."),
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`email-lookup-${ip}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({ email: searchParams.get("email") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (!process.env.NEUTRINO_API_USER_ID || !process.env.NEUTRINO_API_KEY) {
    return NextResponse.json({ error: "Email lookup not configured." }, { status: 503 });
  }

  try {
    const res = await fetch("https://neutrinoapi.net/email-verify", {
      method: "POST",
      headers: { ...neutrinoHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: parsed.data.email, "fix-typos": "true" }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Email verification failed." }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      status: 200,
      data: {
        email: data.email,
        valid: data.valid,
        verified: data.verified,
        domain: data.domain,
        isDisposable: data["is-disposable"],
        isFreemail: data["is-freemail"],
        isPersonal: data["is-personal"],
        isCatchAll: data["is-catch-all"],
        isDeferred: data["is-deferred"],
        smtpStatus: data["smtp-status"],
        mxIp: data["mx-ip"],
        provider: data.provider,
        domainStatus: data["domain-status"],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Email lookup failed." }, { status: 500 });
  }
}
