"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/categories";

type HistoryItem = {
  id: string;
  e164: string;
  countryCode: string | null;
  createdAt: string;
  latestName: string | null;
  latestCategory: string | null;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  function fetchHistory() {
    setLoading(true);
    fetch("/api/search-history")
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }

  async function deleteOne(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/search-history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function clearAll() {
    setClearingAll(true);
    try {
      const res = await fetch("/api/search-history?clearAll=true", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
      }
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fog">Search History</h1>
          <p className="mt-1 text-sm text-mist">Recent phone numbers you looked up.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearingAll}
            className="rounded border border-alert/40 bg-alert/10 px-3 py-1.5 text-xs font-mono font-semibold text-alert hover:bg-alert/20 transition"
          >
            {clearingAll ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-mist font-mono text-sm animate-pulse">Loading search history...</p>
      ) : history.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-fog font-medium">No search history yet.</p>
          <p className="mt-1 text-xs text-mist">Look up any phone number on the home page to start tracking.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="card flex items-center justify-between hover:border-brand/40 transition group"
            >
              <Link
                href={`/number/${encodeURIComponent(item.e164)}`}
                className="flex-1 min-w-0"
              >
                <p className="font-mono text-lg font-bold text-fog group-hover:text-brand transition">{item.e164}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-mist">
                  {item.latestName && <span>Caller: <strong className="text-fog">{item.latestName}</strong></span>}
                  {item.latestCategory && (
                    <span className="rounded bg-panel2 border border-line px-2 py-0.5 font-medium text-fog">
                      {CATEGORY_LABELS[item.latestCategory] || item.latestCategory}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-mono text-mist">{new Date(item.createdAt).toLocaleString()}</span>
                  <span className="block text-xs font-semibold text-brand mt-1">View Details</span>
                </div>
                <button
                  onClick={() => deleteOne(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded border border-alert/40 bg-alert/10 px-2 py-1 text-xs font-mono text-alert hover:bg-alert/20 transition shrink-0"
                  title="Delete from history"
                >
                  {deletingId === item.id ? "..." : "X"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
