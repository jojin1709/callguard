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

export default function AdminDashboardPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadReports() {
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
        localStorage.setItem("callguard_admin_secret", adminSecret);
      })
      .catch(() => {
        setError("Invalid admin secret.");
        setAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const saved = localStorage.getItem("callguard_admin_secret");
    if (saved) {
      setAdminSecret(saved);
    }
  }, []);

  useEffect(() => {
    if (adminSecret) loadReports();
  }, [adminSecret]);

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
            placeholder="Enter admin secret"
            className="input font-mono"
          />
          <button onClick={loadReports} disabled={!adminSecret || loading} className="btn-primary">
            {loading ? "Verifying..." : "Access Dashboard"}
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
