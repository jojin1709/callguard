"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { CATEGORY_LABELS } from "@/lib/phone";

type DirectoryItem = {
  id: string;
  e164: string;
  country: string | null;
  totalReports: number;
  spamScore: number;
  likelyName: string | null;
  topCategory: string;
  latestReportNote: string | null;
};

export default function HomePage() {
  const [directory, setDirectory] = useState<DirectoryItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/directory")
      .then((res) => res.json())
      .then((data) => {
        setDirectory(data.directory ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredDirectory = directory.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "SCAM") return item.spamScore >= 50;
    if (filter === "SAFE") return item.spamScore < 20;
    return item.topCategory === filter;
  });

  const quickBadges = directory.slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-12 py-8 md:grid-cols-2 md:py-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">
            Open Intelligence Engine
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.05] text-fog md:text-5xl">
            Know who&rsquo;s calling
            <br />
            before you answer.
          </h1>
          <p className="mt-5 max-w-md text-mist">
            Search any phone number, email, IP address, or domain against 7 intelligence engines, crowdsourced reports, and a 51K+ spam database — no account required.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/email" className="rounded-full border border-line bg-panel/60 px-3 py-1 text-xs font-mono text-mist transition hover:border-brand/50 hover:text-fog">Email Verify</Link>
            <Link href="/ip" className="rounded-full border border-line bg-panel/60 px-3 py-1 text-xs font-mono text-mist transition hover:border-brand/50 hover:text-fog">IP Lookup</Link>
            <Link href="/domain" className="rounded-full border border-line bg-panel/60 px-3 py-1 text-xs font-mono text-mist transition hover:border-brand/50 hover:text-fog">Domain Check</Link>
            <Link href="/sms" className="rounded-full border border-line bg-panel/60 px-3 py-1 text-xs font-mono text-mist transition hover:border-brand/50 hover:text-fog">SMS Spam Check</Link>
          </div>

          {quickBadges.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-mist">Trending Database Entries:</p>
              <div className="flex flex-wrap gap-2">
                {quickBadges.map((item) => (
                  <Link
                    key={item.e164}
                    href={`/number/${encodeURIComponent(item.e164)}`}
                    className="group flex items-center gap-1.5 rounded-full border border-line bg-panel/60 px-3 py-1 text-xs text-mist transition hover:border-brand/50 hover:text-fog"
                  >
                    <span className="font-mono">{item.e164}</span>
                    <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand font-medium group-hover:bg-brand/20">
                      {item.likelyName || item.topCategory}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
          <span className="radar-ring radar-pulse" />
          <span className="radar-ring radar-pulse [animation-delay:0.8s]" />
          <span className="radar-ring radar-pulse [animation-delay:1.6s]" />
          <div className="absolute inset-6 rounded-full border border-line" />
          <div className="absolute inset-14 rounded-full border border-line/70" />
          <div className="radar-sweep absolute inset-6 overflow-hidden rounded-full">
            <div
              className="h-full w-1/2 origin-right"
              style={{
                background:
                  "conic-gradient(from 90deg, rgba(76,124,255,0.45), transparent 70%)",
              }}
            />
          </div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-panel2 ring-1 ring-brand/40">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          </div>
          <span className="absolute right-8 top-14 h-1.5 w-1.5 rounded-full bg-alert" />
          <span className="absolute bottom-10 left-10 h-1.5 w-1.5 rounded-full bg-warn" />
        </div>
      </section>

      {/* PUBLIC DATABASE DIRECTORY SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-fog">Public Caller & Spam Directory</h2>
            <p className="mt-1 text-sm text-mist">Explore live community reports and verified Numverify carrier intelligence.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "All Numbers" },
              { id: "SCAM", label: "High Risk Scams" },
              { id: "TELEMARKETER", label: "Telemarketers" },
              { id: "DELIVERY", label: "Delivery" },
              { id: "SAFE", label: "Verified / Safe" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  filter === tab.id
                    ? "bg-brand text-white"
                    : "border border-line text-mist hover:text-fog"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-mist">Loading caller database...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDirectory.map((item) => {
              const badgeColor =
                item.spamScore >= 60
                  ? "bg-alert/10 text-alert border-alert/30"
                  : item.spamScore >= 20
                  ? "bg-warn/10 text-warn border-warn/30"
                  : "bg-signal/10 text-signal border-signal/30";

              return (
                <Link
                  key={item.e164}
                  href={`/number/${encodeURIComponent(item.e164)}`}
                  className="card group flex flex-col justify-between transition hover:border-brand/50 hover:bg-panel/80"
                >
                  <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-base font-semibold text-fog group-hover:text-brand">
                          {item.e164}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}>
                          {item.spamScore}% Spam
                        </span>
                      </div>

                      <p className="mt-2 font-display text-sm text-fog font-medium">
                        {item.likelyName || "Reported Number"}
                      </p>

                      <p className="mt-1 text-xs text-mist">
                        Category: {CATEGORY_LABELS[item.topCategory] || item.topCategory} · {item.totalReports} Report{item.totalReports === 1 ? "" : "s"}
                      </p>

                      {item.latestReportNote && (
                        <p className="mt-3 line-clamp-2 rounded bg-ink/50 p-2 text-xs italic text-mist">
                          &quot;{item.latestReportNote}&quot;
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-brand group-hover:underline">
                      <span>View Live Lookup &rarr;</span>
                      {item.country && <span className="text-mist font-mono">{item.country}</span>}
                    </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 border-t border-line pt-10 md:grid-cols-3">
        <FeatureCard
          eyebrow="Open Lookup"
          title="Search any number"
          body="Instant spam score, caller name, line type, and carrier breakdown from Numverify API and community reports."
        />
        <FeatureCard
          eyebrow="Public Reporting"
          title="Flag what you get"
          body="Scam, robocall, telemarketer, delivery, or safe — report any caller in seconds without registration."
        />
        <FeatureCard
          eyebrow="Personal Reference"
          title="Your own list"
          body="Save contacts and maintain your personal block list right in your browser."
        />
      </section>
    </div>
  );
}

function FeatureCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-xl2 border border-line bg-panel p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      <h3 className="mt-3 font-display text-lg text-fog">{title}</h3>
      <p className="mt-2 text-sm text-mist">{body}</p>
    </div>
  );
}
