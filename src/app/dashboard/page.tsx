"use client";

import { useEffect, useState } from "react";

type Contact = { id: string; name: string; phoneNumber: { e164: string } };
type BlockEntry = { id: string; reason: string | null; phoneNumber: { e164: string } };

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blocklist, setBlocklist] = useState<BlockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"contacts" | "blocklist">("contacts");

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/blocklist").then((r) => r.json()),
    ])
      .then(([c, b]) => {
        setContacts(c.contacts || []);
        setBlocklist(b.entries || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function deleteContact(id: string) {
    await fetch("/api/contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function deleteBlock(id: string) {
    await fetch("/api/blocklist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setBlocklist((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Contacts & Blocklist</h1>
        <p className="mt-1 text-sm text-mist">Manage your saved contacts and blocked numbers.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("contacts")} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${tab === "contacts" ? "bg-brand text-white" : "border border-line text-mist hover:text-fog"}`}>
          Contacts ({contacts.length})
        </button>
        <button onClick={() => setTab("blocklist")} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${tab === "blocklist" ? "bg-alert text-white" : "border border-line text-mist hover:text-fog"}`}>
          Blocklist ({blocklist.length})
        </button>
      </div>

      {loading ? (
        <p className="text-mist font-mono text-sm animate-pulse">Loading...</p>
      ) : tab === "contacts" ? (
        contacts.length === 0 ? (
          <div className="card text-center py-12"><p className="text-fog">No contacts saved yet.</p></div>
        ) : (
          <div className="grid gap-3">
            {contacts.map((c) => (
              <div key={c.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-fog">{c.name}</p>
                  <p className="text-xs font-mono text-mist">{c.phoneNumber.e164}</p>
                </div>
                <button onClick={() => deleteContact(c.id)} className="rounded border border-alert/40 bg-alert/10 px-2 py-1 text-xs font-mono text-alert hover:bg-alert/20 transition">Remove</button>
              </div>
            ))}
          </div>
        )
      ) : blocklist.length === 0 ? (
        <div className="card text-center py-12"><p className="text-fog">No numbers blocked yet.</p></div>
      ) : (
        <div className="grid gap-3">
          {blocklist.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-fog">{b.phoneNumber.e164}</p>
                {b.reason && <p className="text-xs text-mist mt-1">{b.reason}</p>}
              </div>
              <button onClick={() => deleteBlock(b.id)} className="rounded border border-alert/40 bg-alert/10 px-2 py-1 text-xs font-mono text-alert hover:bg-alert/20 transition">Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
