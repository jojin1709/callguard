"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/phone";

type AdminReport = {
  id: string;
  phone: string;
  displayName: string | null;
  category: string;
  note: string | null;
  createdAt: string;
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_HOURS = 24;

export default function AdminDashboardPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

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
          <h1 className="font-display text-2xl font-bold text-fog">Admin Moderation</h1>
          <p className="mt-1 text-sm text-mist">Review and delete community spam reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadReports} className="btn-ghost text-xs">
            Refresh
          </button>
          <button onClick={() => { setAuthenticated(false); setAdminSecret(""); localStorage.removeItem("callguard_admin_secret"); }} className="btn-ghost text-xs text-alert">
            Lock
          </button>
        </div>
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
    </div>
  );
}
