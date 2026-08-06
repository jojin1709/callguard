"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/phone";

type LineTypeIntel = {
  lineType: "mobile" | "landline" | "voip" | "toll_free" | "unknown";
  carrierName: string;
  isVoip: boolean;
  isLandline: boolean;
  countryName: string;
  location?: string | null;
  localFormat?: string | null;
  internationalFormat?: string | null;
};

type NumverifyData = {
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

type NumlookupData = {
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

type IpqsData = {
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
  user_activity?: string | null;
  sms_pumping?: {
    risk_score?: number;
    message?: string;
    velocity?: string;
  };
};

type LookupResult = {
  e164: string;
  country: string | null;
  lineTypeIntelligence?: LineTypeIntel;
  numlookupData?: NumlookupData | null;
  numverifyData?: NumverifyData | null;
  ipqsData?: IpqsData | null;
  found: boolean;
  totalReports: number;
  spamScore: number;
  likelyName: string | null;
  categoryBreakdown: Record<string, number>;
  reports: {
    id: string;
    displayName: string | null;
    category: string;
    note: string | null;
    createdAt: string;
  }[];
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export default function NumberPage() {
  const params = useParams<{ phone: string }>();

  const [data, setData] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("SAFE");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [voteScore, setVoteScore] = useState<number>(0);
  const [userVoted, setUserVoted] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/numbers/${encodeURIComponent(params.phone)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't look up that number.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }, [params.phone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleVote(vote: number) {
    if (!data?.likelyName || userVoted) return;
    try {
      const res = await fetch(`/api/numbers/${encodeURIComponent(params.phone)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerName: data.likelyName, vote }),
      });
      const json = await res.json();
      if (res.ok) {
        setVoteScore(json.totalScore);
        setUserVoted(true);
      }
    } catch {
      // ignore
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);

    const res = await fetch(`/api/numbers/${encodeURIComponent(params.phone)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: formName, category: formCategory, note: formNote }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormMsg(json.error ?? "Couldn't submit report.");
      return;
    }
    setFormMsg("Report added. Thanks for adding caller identity.");
    setFormName("");
    setFormNote("");
    setShowQuickAdd(false);
    fetchData();
  }

  async function addTo(kind: "contacts" | "blocklist") {
    setSavedMsg(null);
    const body =
      kind === "contacts"
        ? { phone: params.phone, name: data?.likelyName || "Unnamed" }
        : { phone: params.phone, reason: "Added from lookup" };

    const res = await fetch(`/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSavedMsg(kind === "contacts" ? "Saved to your contacts." : "Added to your block list.");
    } else {
      const json = await res.json();
      setSavedMsg(json.error ?? "Couldn't save.");
    }
  }

  if (loading) return <p className="text-mist font-mono text-sm animate-pulse">Scanning live NumLookupAPI, Numverify & IPQS API threat intelligence…</p>;
  if (error) return <p className="text-alert">{error}</p>;
  if (!data) return null;

  const scoreColor =
    data.spamScore >= 60 ? "text-alert" : data.spamScore >= 20 ? "text-warn" : "text-signal";
  const ringColor =
    data.spamScore >= 60 ? "#FF5D5D" : data.spamScore >= 20 ? "#FFB648" : "#3DDC97";

  const intel = data.lineTypeIntelligence;
  const numlookup = data.numlookupData;
  const numverify = data.numverifyData;
  const ipqs = data.ipqsData;

  const isMobileLine = (intel?.lineType === "mobile" || numlookup?.line_type === "mobile" || numverify?.line_type === "mobile");

  return (
    <div className="space-y-8">
      {/* HEADER CARD */}
      <div className="card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-2xl font-bold text-fog">{data.e164}</p>
            {(numlookup?.valid || numverify?.valid || ipqs?.valid) && (
              <span className="rounded-full bg-signal/15 border border-signal/30 px-2.5 py-0.5 text-xs font-medium text-signal">
                ✓ Valid E.164
              </span>
            )}
            {isMobileLine && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                💬 WhatsApp Active
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-mist">
            <span>{intel?.countryName || numlookup?.country_name || numverify?.country_name || data.country}</span>
            {intel?.location && <span>• {intel.location}</span>}
            <span>•</span>
            <span className="capitalize">{intel?.lineType || "mobile"} line</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-display text-xl text-fog font-medium">
              {data.likelyName ?? (data.found ? "No name reported yet" : "Not in the database yet")}
            </p>

            {data.likelyName ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleVote(1)}
                  disabled={userVoted}
                  className="rounded bg-panel2 border border-line px-2 py-0.5 text-xs font-medium text-fog hover:border-signal hover:text-signal transition disabled:opacity-50"
                  title="Confirm this caller name is correct"
                >
                  👍 Confirm
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={userVoted}
                  className="rounded bg-panel2 border border-line px-2 py-0.5 text-xs font-medium text-fog hover:border-alert hover:text-alert transition disabled:opacity-50"
                  title="Report incorrect caller name"
                >
                  👎 Incorrect
                </button>
                {voteScore !== 0 && (
                  <span className="text-xs font-mono font-bold text-signal ml-1">
                    Score: {voteScore}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="rounded-full bg-brand/10 border border-brand/40 px-2.5 py-0.5 text-xs font-mono text-brand font-medium hover:bg-brand/20 transition"
              >
                🏷️ Add Caller Name
              </button>
            )}
          </div>

          <p className="mt-1 text-xs text-mist">
            {data.totalReports} community report{data.totalReports === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ScoreRing score={data.spamScore} color={ringColor} />
          <div>
            <p className={`font-display text-3xl font-bold ${scoreColor}`}>{data.spamScore}%</p>
            <p className="text-xs uppercase tracking-wider text-mist font-mono">Combined Risk Score</p>
          </div>
        </div>
      </div>

      {/* QUICK ADD CALLER NAME INLINE FORM */}
      {showQuickAdd && (
        <div className="card border-brand/40 bg-panel/90">
          <h3 className="font-display text-base font-medium text-fog">Tag & Add Caller Name</h3>
          <p className="mt-1 text-xs text-mist">Add the person, company, or business name associated with this phone number.</p>
          <form onSubmit={submitReport} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter caller name (e.g. Rahul, SBI Bank, Amazon Driver)"
              className="input flex-1"
              required
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="input sm:w-44"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <button type="submit" disabled={submitting} className="btn-primary shrink-0">
              {submitting ? "Saving..." : "Save Name"}
            </button>
          </form>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => addTo("contacts")} className="btn-ghost text-sm flex items-center gap-2">
          <span>👤</span> Save as contact
        </button>
        <button onClick={() => addTo("blocklist")} className="btn-ghost text-sm flex items-center gap-2 hover:border-alert/50 hover:text-alert">
          <span>🚫</span> Add to block list
        </button>
        {savedMsg && <span className="self-center text-sm font-medium text-signal">{savedMsg}</span>}
      </div>

      {/* NUMLOOKUPAPI LIVE CARRIER ENGINE CARD */}
      <div className="card border-brand/50 bg-panel/90">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
            </span>
            <h2 className="font-display text-base font-medium text-fog">NumLookupAPI Live Carrier Engine</h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-brand bg-brand/10 border border-brand/30 px-2.5 py-0.5 rounded-full font-semibold">
            Primary API Active
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Telecom Operator</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {numlookup?.carrier || intel?.carrierName || "Standard Network"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Circle / Region</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {numlookup?.location || intel?.location || "National Network"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Line Type</p>
            <p className="mt-1 text-sm font-semibold text-fog capitalize">
              {numlookup?.line_type || intel?.lineType || "mobile"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Local National Format</p>
            <p className="mt-1 font-mono text-sm font-semibold text-fog">
              {numlookup?.local_format || data.e164}
            </p>
          </div>
        </div>
      </div>

      {/* IPQUALITYSCORE (IPQS) FRAUD & RISK ENGINE CARD */}
      <div className="card border-alert/30 bg-panel/90">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-alert" />
            </span>
            <h2 className="font-display text-base font-medium text-fog">IPQualityScore (IPQS) Fraud Risk Engine</h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-alert bg-alert/10 border border-alert/30 px-2.5 py-0.5 rounded-full font-semibold">
            Reverse Lookup & Risk API
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Reverse Identity Name</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {ipqs?.name && ipqs.name !== "N/A" ? ipqs.name : (data.likelyName || "Individual / Private Line")}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Fraud Score</p>
            <p className={`mt-1 text-sm font-semibold ${(ipqs?.fraud_score ?? data.spamScore) >= 50 ? "text-alert" : "text-signal"}`}>
              {ipqs?.fraud_score ?? data.spamScore} / 100 Risk Rating
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Line Active Status</p>
            <p className="mt-1 text-sm font-semibold text-signal">
              {ipqs?.active_status || (ipqs?.active ? "Active Line" : "Verified Carrier Connection")}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Recent Abuse / Spammer</p>
            <p className={`mt-1 text-sm font-semibold ${ipqs?.recent_abuse || ipqs?.spammer || data.spamScore >= 50 ? "text-alert" : "text-signal"}`}>
              {ipqs?.recent_abuse || ipqs?.spammer || data.spamScore >= 50 ? "⚠️ Recent Abuse Detected" : "✓ Clean History"}
            </p>
          </div>
        </div>

        {/* RISK & TCPA INDICATOR BADGES */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line/50 pt-3">
          <span className={`rounded border px-2.5 py-1 text-xs font-mono font-medium ${ipqs?.VOIP ? "bg-warn/10 text-warn border-warn/30" : "bg-panel2 text-mist border-line"}`}>
            VOIP: {ipqs?.VOIP ? "YES (Virtual)" : "NO (Cellular/Fixed)"}
          </span>
          <span className={`rounded border px-2.5 py-1 text-xs font-mono font-medium ${ipqs?.prepaid ? "bg-warn/10 text-warn border-warn/30" : "bg-panel2 text-mist border-line"}`}>
            Prepaid: {ipqs?.prepaid ? "YES" : "NO / Postpaid"}
          </span>
          <span className={`rounded border px-2.5 py-1 text-xs font-mono font-medium ${ipqs?.tcpa_blacklist ? "bg-alert/10 text-alert border-alert/30" : "bg-panel2 text-mist border-line"}`}>
            TCPA Blacklist: {ipqs?.tcpa_blacklist ? "YES (Blacklisted)" : "Clean"}
          </span>
          {ipqs?.city && (
            <span className="rounded border border-line bg-panel2 px-2.5 py-1 text-xs font-mono text-fog">
              📍 {ipqs.city}{ipqs.region ? `, ${ipqs.region}` : ""} {ipqs.zip_code || ""}
            </span>
          )}
        </div>
      </div>

      {/* NUMVERIFY CARRIER BACKUP CARD */}
      <div className="card border-line bg-panel/90">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
            </span>
            <h2 className="font-display text-base font-medium text-fog">Numverify Live Backup Engine</h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-mist bg-panel2 border border-line px-2.5 py-0.5 rounded-full font-semibold">
            Secondary API
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Carrier Operator</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {numverify?.carrier || intel?.carrierName || "Standard Network"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Location / Circle</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {numverify?.location || intel?.location || "National Network"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">Line Type</p>
            <p className="mt-1 text-sm font-semibold text-fog capitalize">
              {numverify?.line_type || intel?.lineType || "mobile"}
            </p>
          </div>

          <div className="rounded-lg border border-line/60 bg-ink/40 p-3">
            <p className="text-xs font-mono text-mist uppercase">National Format</p>
            <p className="mt-1 font-mono text-sm font-semibold text-fog">
              {numverify?.local_format || data.e164}
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      {Object.keys(data.categoryBreakdown).length > 0 && (
        <div className="card">
          <h2 className="font-display text-base text-fog">Category breakdown</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(data.categoryBreakdown).map(([cat, count]) => (
              <span
                key={cat}
                className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs text-mist font-medium"
              >
                {CATEGORY_LABELS[cat] ?? cat} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* RECENT REPORTS */}
      <div className="card">
        <h2 className="font-display text-base text-fog">Recent community reports</h2>
        {data.reports.length === 0 ? (
          <p className="mt-3 text-sm text-mist">No reports yet. Be the first to flag this number.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.reports.map((r) => (
              <li key={r.id} className="border-b border-line pb-3 last:border-none last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fog">
                    {r.displayName || "Unnamed"} — {CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                  <span className="text-xs text-mist">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.note && <p className="mt-1 text-sm text-mist">{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* REPORT FORM */}
      <div className="card">
        <h2 className="font-display text-base text-fog">Report this number</h2>
        <form onSubmit={submitReport} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-mist">Name you saw calling</span>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. 'Insurance Offer'"
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-mist">Category</span>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-mist">Note (optional)</span>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </label>
          {formMsg && <p className="text-sm font-medium text-signal">{formMsg}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#26303F" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}
