"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CountryCodeItem = {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
};

export const SUPPORTED_COUNTRIES: CountryCodeItem[] = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭" },
  { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
];

export default function SearchBar() {
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(SUPPORTED_COUNTRIES[0]);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a phone number to look up.");
      return;
    }
    setError(null);

    let fullNumber = trimmed;
    if (!trimmed.startsWith("+")) {
      fullNumber = `${selectedCountry.dialCode}${trimmed.replace(/\D/g, "")}`;
    }

    router.push(`/number/${encodeURIComponent(fullNumber)}`);
  }

  const filteredCountries = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.dialCode.includes(searchFilter) ||
      c.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 shadow-lg transition focus-within:border-brand/60">
          {/* COUNTRY SELECTOR BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-panel2 px-3 py-2.5 text-sm font-mono font-medium text-fog hover:border-brand/50 transition"
            >
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
              <span className="text-xs text-mist">▼</span>
            </button>

            {/* DROPDOWN MENU */}
            {isOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-line bg-panel p-2 shadow-2xl backdrop-blur-md">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full rounded-lg border border-line bg-panel2 px-3 py-1.5 text-xs text-fog outline-none placeholder:text-mist mb-2 font-mono"
                  autoFocus
                />
                <div className="space-y-1">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                        selectedCountry.code === c.code
                          ? "bg-brand/15 text-brand font-bold"
                          : "text-fog hover:bg-panel2"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-mist">{c.dialCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* INPUT FIELD */}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter phone number..."
            className="w-full bg-transparent px-2 font-mono text-lg text-fog outline-none placeholder:text-mist"
            inputMode="tel"
            aria-label="Phone number"
          />

          {/* SUBMIT SCAN BUTTON */}
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand px-6 py-2.5 font-medium text-white transition hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Scan
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-alert">{error}</p>}
      </form>
    </div>
  );
}
