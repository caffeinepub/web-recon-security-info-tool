import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  FileSearch,
  FileText,
  Loader2,
  RotateCcw,
  Server,
  Shield,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type WhoisData, fetchWhoisData } from "../services/reconApi";
import { WhoisSection } from "./WhoisSection";

// ─── History entry ────────────────────────────────────────────────────────────

interface WhoisHistoryEntry {
  domain: string;
  timestamp: number;
  registrar: string;
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function WhoisLookupDashboard() {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WhoisData | null>(null);
  const [history, setHistory] = useState<WhoisHistoryEntry[]>([]);

  const handleLookup = useCallback(
    async (overrideDomain?: string) => {
      const d = (overrideDomain ?? domain)
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
      if (!d) {
        setError("Enter a domain name to look up");
        return;
      }

      setError("");
      setIsLoading(true);
      setResult(null);

      try {
        const data = await fetchWhoisData(d);
        if (!data) {
          setError(
            "WHOIS lookup failed — the API rate limit may have been reached, or the domain could not be found. Please try again in a moment.",
          );
          return;
        }
        setResult(data);
        toast.success(`WHOIS data retrieved for ${d}`);

        setHistory((prev) => {
          const entry: WhoisHistoryEntry = {
            domain: d,
            timestamp: Date.now(),
            registrar: data.registrar !== "N/A" ? data.registrar : "Unknown",
          };
          return [entry, ...prev.filter((h) => h.domain !== d)].slice(0, 5);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "WHOIS lookup failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [domain],
  );

  const quickDomains = [
    { label: "google.com", hint: "Google LLC" },
    { label: "github.com", hint: "Microsoft" },
    { label: "cloudflare.com", hint: "Cloudflare Inc" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Input section ──────────────────────────────────────────────────── */}
      <div className="rounded-lg p-6 bg-[oklch(0.16_0.015_235)] border border-[oklch(0.38_0.10_60)] shadow-[0_0_12px_oklch(0.78_0.18_60_/_0.08)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded bg-[oklch(0.14_0.02_60)] border border-[oklch(0.40_0.12_60)]">
            <FileSearch className="w-5 h-5 text-[oklch(0.78_0.18_60)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[oklch(0.78_0.18_60)] font-mono uppercase tracking-widest">
              WHOIS Lookup
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Domain registration, ownership &amp; nameserver intelligence
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[oklch(0.14_0.02_240)] border border-[oklch(0.28_0.04_220)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.18_60)] blink" />
            <span className="font-mono text-[10px] text-[oklch(0.55_0.04_220)]">
              HACKERTARGET
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label
              htmlFor="whois-domain-input"
              className="block font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)] mb-1.5"
            >
              Domain Name <span className="text-[oklch(0.75_0.22_25)]">*</span>
            </label>
            <Input
              id="whois-domain-input"
              data-ocid="whois.domain_input"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) handleLookup();
              }}
              placeholder="Enter domain, e.g. example.com"
              disabled={isLoading}
              className="font-mono bg-[oklch(0.12_0.01_240)] border-[oklch(0.28_0.04_220)] text-[oklch(0.85_0.02_220)] placeholder:text-muted-foreground/40 focus:border-[oklch(0.55_0.14_60)] h-11 text-sm"
            />
          </div>
          <div className="flex-shrink-0 self-end">
            <Button
              data-ocid="whois.lookup_button"
              onClick={() => handleLookup()}
              disabled={isLoading || !domain.trim()}
              className="h-11 px-5 bg-[oklch(0.60_0.16_60)] text-[oklch(0.08_0.01_240)] hover:bg-[oklch(0.68_0.18_60)] font-mono font-bold uppercase tracking-wider border-0 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSearch className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isLoading ? "Looking up..." : "WHOIS Lookup"}
              </span>
            </Button>
          </div>
        </div>

        <p className="mt-2.5 font-mono text-[10px] text-[oklch(0.45_0.04_220)]">
          <span className="text-[oklch(0.50_0.10_60)]">{"//"} </span>
          Queries HackerTarget WHOIS API for registrar, registrant, dates &amp;
          nameserver data.
        </p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              data-ocid="whois.error_state"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => handleLookup()}
                className="flex items-center gap-1 text-[oklch(0.60_0.12_60)] hover:text-[oklch(0.76_0.18_60)] transition-colors flex-shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick lookup buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-[oklch(0.45_0.04_220)]">
            Quick lookup:
          </span>
          {quickDomains.map(({ label, hint }, i) => (
            <button
              type="button"
              key={label}
              data-ocid={`whois.quick_lookup_button.${i + 1}`}
              onClick={() => {
                setDomain(label);
                handleLookup(label);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs bg-[oklch(0.16_0.015_240)] border border-[oklch(0.28_0.04_220)] text-[oklch(0.65_0.10_60)] hover:border-[oklch(0.42_0.12_60)] hover:bg-[oklch(0.18_0.02_240)] transition-all"
            >
              <FileText className="w-2.5 h-2.5" />
              {label}
              <span className="text-[oklch(0.45_0.04_220)] text-[9px]">
                ({hint})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading state ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            data-ocid="whois.loading_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg p-12 flex flex-col items-center justify-center gap-4 bg-[oklch(0.14_0.015_240)] border border-[oklch(0.38_0.10_60)] shadow-[0_0_12px_oklch(0.78_0.18_60_/_0.08)]"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border border-[oklch(0.35_0.09_60)] flex items-center justify-center">
                <FileSearch className="w-8 h-8 text-[oklch(0.55_0.12_60)] scan-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-t-[oklch(0.78_0.18_60)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-semibold text-[oklch(0.78_0.18_60)]">
                Querying WHOIS registry...
              </p>
              <p className="font-mono text-xs text-[oklch(0.50_0.04_220)] mt-1">
                Fetching registration data for{" "}
                <span className="text-[oklch(0.70_0.12_60)]">{domain}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            data-ocid="whois.success_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Result summary bar */}
            <div className="rounded-lg px-4 py-3 bg-[oklch(0.14_0.02_60)] border border-[oklch(0.30_0.08_60)] flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FileSearch className="w-3.5 h-3.5 text-[oklch(0.78_0.18_60)]" />
                <span className="font-mono text-xs font-bold text-[oklch(0.78_0.18_60)]">
                  {result.domain}
                </span>
              </div>
              {result.registrar && result.registrar !== "N/A" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.16_0.03_60)] text-[oklch(0.70_0.14_60)] border border-[oklch(0.32_0.08_60)]">
                  <Building2 className="w-2.5 h-2.5" />
                  {result.registrar.length > 40
                    ? `${result.registrar.slice(0, 40)}…`
                    : result.registrar}
                </span>
              )}
              {result.expiryDate && result.expiryDate !== "N/A" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.16_0.03_155)] text-[oklch(0.65_0.12_155)] border border-[oklch(0.30_0.07_155)]">
                  <Calendar className="w-2.5 h-2.5" />
                  Expires: {result.expiryDate.split("T")[0]}
                </span>
              )}
              <span className="ml-auto font-mono text-[10px] text-[oklch(0.45_0.04_220)] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* WHOIS fields card */}
            <div className="rounded-lg border border-[oklch(0.32_0.08_60)] bg-[oklch(0.13_0.015_240)] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[oklch(0.22_0.03_220_/_0.5)]">
                <div className="p-1.5 rounded bg-[oklch(0.14_0.01_240)] border border-[oklch(0.32_0.08_60)]">
                  <FileText className="w-3.5 h-3.5 text-[oklch(0.78_0.18_60)]" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[oklch(0.78_0.18_60)]">
                  WHOIS Record
                </span>
                <div className="ml-auto flex items-center gap-3">
                  {/* Summary badges */}
                  {result.nameServers &&
                    result.nameServers.length > 0 &&
                    result.nameServers[0] !== "N/A" && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.16_0.03_195)] text-[oklch(0.65_0.12_195)] border border-[oklch(0.30_0.07_195)]">
                        <Server className="w-2.5 h-2.5" />
                        {result.nameServers.length} NS
                      </span>
                    )}
                  {result.registrant && result.registrant !== "N/A" && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.16_0.03_290)] text-[oklch(0.65_0.12_290)] border border-[oklch(0.30_0.07_290)]">
                      <User className="w-2.5 h-2.5" />
                      Registrant
                    </span>
                  )}
                </div>
              </div>

              {/* WhoisSection renders the data fields */}
              <div className="p-4">
                <WhoisSection whoisData={result} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty initial state ─────────────────────────────────────────────── */}
      {!result && !isLoading && !error && (
        <div className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-[oklch(0.14_0.03_60)] border border-[oklch(0.38_0.10_60)] flex items-center justify-center">
              <FileSearch className="w-10 h-10 text-[oklch(0.50_0.12_60)] scan-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.18_0.04_60)] border border-[oklch(0.42_0.12_60)] flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-[oklch(0.78_0.18_60)]" />
            </div>
          </div>
          <h3 className="font-mono text-lg font-semibold text-[oklch(0.75_0.04_220)] mb-2">
            Domain WHOIS Intelligence
          </h3>
          <p className="font-mono text-sm text-[oklch(0.50_0.04_220)] max-w-md">
            Enter a domain name above to retrieve registration, ownership, and
            nameserver data from the WHOIS registry.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            {[
              {
                label: "Registrar",
                desc: "Domain registrar name",
                icon: Building2,
                color: "text-[oklch(0.65_0.12_60)]",
                border: "border-[oklch(0.28_0.06_60)]",
                bg: "bg-[oklch(0.14_0.02_60_/_0.3)]",
              },
              {
                label: "Dates",
                desc: "Created, expires, updated",
                icon: Calendar,
                color: "text-[oklch(0.65_0.12_155)]",
                border: "border-[oklch(0.28_0.06_155)]",
                bg: "bg-[oklch(0.14_0.02_155_/_0.3)]",
              },
              {
                label: "Name Servers",
                desc: "Authoritative DNS servers",
                icon: Server,
                color: "text-[oklch(0.65_0.12_195)]",
                border: "border-[oklch(0.28_0.06_195)]",
                bg: "bg-[oklch(0.14_0.02_195_/_0.3)]",
              },
              {
                label: "Registrant",
                desc: "Owner organization",
                icon: User,
                color: "text-[oklch(0.65_0.12_290)]",
                border: "border-[oklch(0.28_0.06_290)]",
                bg: "bg-[oklch(0.14_0.02_290_/_0.3)]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-4 py-3 rounded ${item.bg} border ${item.border} text-left`}
              >
                <item.icon className={`w-3.5 h-3.5 mb-1.5 ${item.color}`} />
                <div
                  className={`font-mono text-xs font-bold mb-1 ${item.color}`}
                >
                  {item.label}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search history ──────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="rounded-lg p-4 bg-[oklch(0.14_0.015_235)] border border-[oklch(0.28_0.04_220)]">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-[oklch(0.55_0.06_220)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)]">
              Recent Lookups
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((entry, i) => (
              <button
                type="button"
                key={`${entry.domain}-${entry.timestamp}`}
                data-ocid={`whois.item.${i + 1}`}
                onClick={() => {
                  setDomain(entry.domain);
                  handleLookup(entry.domain);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[oklch(0.15_0.015_240)] border border-[oklch(0.26_0.03_220)] hover:border-[oklch(0.38_0.08_60)] transition-all group"
              >
                <FileText className="w-2.5 h-2.5 text-[oklch(0.55_0.08_60)] group-hover:text-[oklch(0.72_0.14_60)]" />
                <span className="font-mono text-xs text-[oklch(0.70_0.08_220)] group-hover:text-[oklch(0.80_0.10_220)]">
                  {entry.domain}
                </span>
                {entry.registrar !== "Unknown" && (
                  <span className="hidden sm:inline font-mono text-[9px] text-[oklch(0.45_0.04_220)]">
                    {entry.registrar.length > 20
                      ? `${entry.registrar.slice(0, 20)}…`
                      : entry.registrar}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
