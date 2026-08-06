"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";

type AdminReport = {
  id: string;
  phone: string;
  displayName: string | null;
  category: string;
  note: string | null;
  createdAt: string;
};

type SpamDbStats = {
  totalNumbers: number;
  totalKeywords: number;
  bySource: { source: string; count: number }[];
  byCategory: { category: string; count: number }[];
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_HOURS = 24;

const SOURCE_LABELS: Record<string, string> = {
  blockednumbers: "Blocked Numbers (GitHub)",
  callshield: "CallShield DB",
  fcc: "FCC Complaints",
  community: "Community Reports",
};

export default function AdminDashboardPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const [spamStats, setSpamStats] = useState<SpamDbStats | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "spamdb">("reports");

  useEffect(() => {
    const saved = localStorage.getItem("callguard_admin_secret");
    const savedAttempts = localStorage.getItem("callguard_admin_attempts");
    const savedLockout = localStorage.getItem("callguard_admin_lockout");

    if (saved) setAdminSecret(saved);
    if (savedAttempts) setAttempts(parseInt(savedAttempts));
    if (savedLockout) {
      const lockTime = parseInt(savedLockout);
      if (Date.now() < lockTime) {
        setLockedUntil(lockTime);
      } else {
        localStorage.removeItem("callguard_admin_lockout");
        localStorage.removeItem("callguard_admin_attempts");
        setAttempts(0);
      }
    }
  }, []);

  function loadReports() {
    if (lockedUntil && Date.now() < lockedUntil) {
      const hours = Math.ceil((lockedUntil - Date.now()) / 3600000);
      setError(`Locked out. Try again in ${hours} hour(s).`);
      return;
    }

    setLoading(true);
    setError(null);
    fetch("/api/admin/reports", {
      headers: { "x-admin-secret": adminSecret },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setReports(data.reports || []);
        setAuthenticated(true);
        setAttempts(0);
        localStorage.setItem("callguard_admin_secret", adminSecret);
        localStorage.setItem("callguard_admin_attempts", "0");
        localStorage.removeItem("callguard_admin_lockout");
      })
      .catch(() => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("callguard_admin_attempts", String(newAttempts));

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_HOURS * 3600000;
          setLockedUntil(lockTime);
          localStorage.setItem("callguard_admin_lockout", String(lockTime));
          setError("Too many failed attempts. Locked out for 24 hours.");
        } else {
          setError(`Wrong secret. ${MAX_ATTEMPTS - newAttempts} attempts left.`);
        }
        setAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }

  function loadSpamStats() {
    fetch("/api/admin/spam-db", {
      headers: { "x-admin-secret": adminSecret },
    })
      .then((res) => res.json())
      .then(setSpamStats)
      .catch(() => {});
  }

  async function runImport(source: string = "all") {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret, "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (data.success) {
        const parts = Object.entries(data.imported)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        setImportResult(`Imported: ${parts}. Total: ${data.totalNumbers} numbers, ${data.totalKeywords} keywords.`);
        loadSpamStats();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch {
      setImportResult("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function clearSpamDb(source?: string) {
    if (!confirm(`Delete ${source ? source : "ALL"} spam data?`)) return;
    const url = source ? `/api/admin/spam-db?source=${source}` : "/api/admin/spam-db";
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "x-admin-secret": adminSecret },
    });
    const data = await res.json();
    setImportResult(`Deleted: ${data.deleted} entries.`);
    loadSpamStats();
  }

  async function deleteReport(id: string) {
    if (!confirm("Delete this report?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  if (!authenticated) {
    return (
      <div className="space-y-6">
        <div className="card">
          <h1 className="font-display text-2xl font-bold text-fog">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-mist">Enter your admin secret to access the moderation panel.</p>
        </div>
        <div className="card space-y-4 max-w-md">
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadReports(); }}
            placeholder="Enter admin secret"
            className="input font-mono"
            disabled={isLocked}
          />
          <button
            onClick={loadReports}
            disabled={!adminSecret || loading || isLocked}
            className="btn-primary"
          >
            {isLocked ? "Locked Out" : loading ? "Verifying..." : "Access Dashboard"}
          </button>
          {error && <p className="text-alert text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fog">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-mist">Moderation & spam database management.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setAuthenticated(false); setAdminSecret(""); localStorage.removeItem("callguard_admin_secret"); }} className="btn-ghost text-xs text-alert">
            Lock
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("reports"); }}
          className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition ${activeTab === "reports" ? "bg-fog text-midnight" : "bg-panel2 text-mist hover:text-fog border border-line"}`}
        >
          Reports ({reports.length})
        </button>
        <button
          onClick={() => { setActiveTab("spamdb"); loadSpamStats(); }}
          className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition ${activeTab === "spamdb" ? "bg-fog text-midnight" : "bg-panel2 text-mist hover:text-fog border border-line"}`}
        >
          Spam Database
        </button>
      </div>

      {activeTab === "reports" && (
        <>
          <div className="card flex items-center justify-between">
            <p className="text-sm text-mist">Community spam reports</p>
            <button onClick={loadReports} className="btn-ghost text-xs">Refresh</button>
          </div>
          {loading ? (
            <p className="text-mist font-mono text-sm animate-pulse">Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-fog font-medium">No reports found.</p>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-fog border-collapse">
                  <thead>
                    <tr className="border-b border-line text-xs font-mono text-mist uppercase">
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Note</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-panel2/50 transition">
                        <td className="py-3 px-3 font-mono font-bold">{r.phone}</td>
                        <td className="py-3 px-3 font-medium text-fog">{r.displayName || "—"}</td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-panel2 border border-line px-2 py-0.5 text-xs font-medium text-fog">
                            {CATEGORY_LABELS[r.category] || r.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-mist text-xs max-w-xs truncate">{r.note || "—"}</td>
                        <td className="py-3 px-3 font-mono text-xs text-mist">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => deleteReport(r.id)}
                            disabled={deletingId === r.id}
                            className="rounded border border-alert/40 bg-alert/10 px-2.5 py-1 text-xs font-mono font-semibold text-alert hover:bg-alert/20 transition"
                          >
                            {deletingId === r.id ? "..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "spamdb" && (
        <>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-fog">Local Spam Database</h2>
                <p className="text-xs text-mist">Imported from blocked-numbers, CallShield, FCC, and SMS keyword patterns.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={loadSpamStats} className="btn-ghost text-xs" disabled={importing}>Refresh</button>
                <button onClick={() => runImport("all")} className="btn-primary text-xs" disabled={importing}>
                  {importing ? "Importing..." : "Import All Sources"}
                </button>
              </div>
            </div>

            {importResult && (
              <p className="text-xs font-mono text-alert bg-alert/10 border border-alert/30 rounded p-2">{importResult}</p>
            )}

            {spamStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded border border-line bg-panel2 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-fog">{spamStats.totalNumbers.toLocaleString()}</p>
                  <p className="text-xs text-mist mt-1">Spam Numbers</p>
                </div>
                <div className="rounded border border-line bg-panel2 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-fog">{spamStats.totalKeywords}</p>
                  <p className="text-xs text-mist mt-1">SMS Keywords</p>
                </div>
                <div className="rounded border border-line bg-panel2 p-4">
                  <p className="text-xs font-semibold text-fog mb-2">By Source</p>
                  {spamStats.bySource.length === 0 ? (
                    <p className="text-xs text-mist">No data imported yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {spamStats.bySource.map((s) => (
                        <div key={s.source} className="flex justify-between text-xs">
                          <span className="text-mist">{SOURCE_LABELS[s.source] || s.source}</span>
                          <span className="font-mono text-fog">{s.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-mist text-sm animate-pulse">Loading stats...</p>
            )}

            {spamStats && spamStats.byCategory.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-fog mb-2">By Category</p>
                <div className="flex flex-wrap gap-2">
                  {spamStats.byCategory.map((c) => (
                    <span key={c.category} className="rounded bg-panel2 border border-line px-2 py-0.5 text-xs font-mono text-fog">
                      {c.category}: {c.count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <p className="text-xs font-semibold text-fog mb-2">Import Individual Sources</p>
              <div className="flex flex-wrap gap-2">
                {["blockednumbers", "callshield", "fcc", "keywords"].map((src) => (
                  <button
                    key={src}
                    onClick={() => runImport(src)}
                    disabled={importing}
                    className="rounded border border-line bg-panel2 px-3 py-1.5 text-xs font-mono text-fog hover:bg-fog hover:text-midnight transition"
                  >
                    {SOURCE_LABELS[src] || src}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => clearSpamDb()} className="rounded border border-alert/40 bg-alert/10 px-3 py-1.5 text-xs font-mono text-alert hover:bg-alert/20 transition" disabled={importing}>
                  Clear All
                </button>
                {spamStats?.bySource.map((s) => (
                  <button
                    key={s.source}
                    onClick={() => clearSpamDb(s.source)}
                    className="rounded border border-alert/40 bg-alert/10 px-3 py-1.5 text-xs font-mono text-alert hover:bg-alert/20 transition"
                    disabled={importing}
                  >
                    Clear {SOURCE_LABELS[s.source] || s.source}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
