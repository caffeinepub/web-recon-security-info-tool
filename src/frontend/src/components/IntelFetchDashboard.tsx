import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Radio,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  type IntelResult,
  type IntelSource,
  type IpApiResult,
  type OtxResult,
  type ShodanInternetDBResult,
  runIntelFetch,
} from "../services/intelApi";

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IntelSource<unknown>["status"] }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.20_0.03_240)] text-[oklch(0.60_0.06_220)] border border-[oklch(0.30_0.04_220)]">
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        LOADING
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.18_0.04_155)] text-[oklch(0.72_0.18_155)] border border-[oklch(0.38_0.12_155)]">
        <CheckCircle2 className="w-2.5 h-2.5" />
        SUCCESS
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.20_0.06_25)] text-[oklch(0.75_0.22_25)] border border-[oklch(0.38_0.14_25)]">
        <XCircle className="w-2.5 h-2.5" />
        ERROR
      </span>
    );
  }
  if (status === "no-data") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.18_0.02_240)] text-[oklch(0.55_0.04_220)] border border-[oklch(0.28_0.03_220)]">
        <Shield className="w-2.5 h-2.5" />
        NO DATA
      </span>
    );
  }
  return null;
}

// ─── Copy JSON button ─────────────────────────────────────────────────────────

function CopyButton({ data, ocid }: { data: unknown; ocid: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.16_0.015_240)] border border-[oklch(0.28_0.04_220)] text-[oklch(0.55_0.06_220)] hover:text-[oklch(0.76_0.18_290)] hover:border-[oklch(0.40_0.12_290)] transition-all"
    >
      {copied ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <Copy className="w-2.5 h-2.5" />
      )}
      {copied ? "Copied" : "Copy JSON"}
    </button>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function IntelPanel({
  title,
  icon,
  accentClass,
  borderClass,
  bgClass,
  status,
  copyData,
  copyOcid,
  children,
  defaultExpanded = true,
}: {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  status: IntelSource<unknown>["status"];
  copyData: unknown;
  copyOcid: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border overflow-hidden ${borderClass} ${bgClass}`}
    >
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 cursor-pointer select-none text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`p-1.5 rounded bg-[oklch(0.14_0.01_240)] border ${borderClass} flex-shrink-0`}
        >
          {icon}
        </div>
        <span
          className={`font-mono text-xs font-bold uppercase tracking-wider ${accentClass}`}
        >
          {title}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={status} />
          {status === "success" && copyData != null && (
            <CopyButton data={copyData} ocid={copyOcid} />
          )}
          <div
            className={`w-5 h-5 rounded flex items-center justify-center ${accentClass}`}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[oklch(0.22_0.03_220_/_0.5)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── IP Intel Panel content ───────────────────────────────────────────────────

function IpIntelContent({ source }: { source: IntelSource<IpApiResult> }) {
  if (source.status === "error") {
    return (
      <div className="pt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{source.error}</span>
      </div>
    );
  }
  if (source.status !== "success" || !source.data) {
    return null;
  }

  const d = source.data;
  const countryFlag = d.countryCode
    ? String.fromCodePoint(
        ...Array.from(d.countryCode.toUpperCase()).map(
          (c) => 0x1f1e6 - 65 + c.charCodeAt(0),
        ),
      )
    : "";

  return (
    <div className="pt-3 space-y-4">
      {/* Location */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          Geolocation
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <DataCell label="Country" value={`${countryFlag} ${d.country}`} />
          <DataCell label="Region" value={d.regionName || d.region || "—"} />
          <DataCell label="City" value={d.city || "—"} />
          <DataCell label="ZIP" value={d.zip || "—"} />
          <DataCell
            label="Coordinates"
            value={d.lat && d.lon ? `${d.lat}, ${d.lon}` : "—"}
          />
          <DataCell label="Timezone" value={d.timezone || "—"} />
        </div>
      </div>

      {/* Network */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2 flex items-center gap-1">
          <Server className="w-2.5 h-2.5" />
          Network
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DataCell label="Query IP" value={d.query || "—"} mono />
          <DataCell label="Reverse DNS" value={d.reverse || "—"} mono />
          <DataCell label="ISP" value={d.isp || "—"} />
          <DataCell label="Organization" value={d.org || "—"} />
          <DataCell label="ASN" value={d.as || "—"} mono />
          <DataCell label="ASN Name" value={d.asname || "—"} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2">
          Indicators
        </p>
        <div className="flex flex-wrap gap-2">
          <IndicatorBadge
            label="Proxy / VPN"
            active={d.proxy}
            activeColor="text-[oklch(0.75_0.22_25)]"
            activeBg="bg-[oklch(0.18_0.05_25)]"
            activeBorder="border-[oklch(0.38_0.12_25)]"
            inactiveColor="text-[oklch(0.50_0.04_220)]"
          />
          <IndicatorBadge
            label="Hosting / DC"
            active={d.hosting}
            activeColor="text-[oklch(0.78_0.20_55)]"
            activeBg="bg-[oklch(0.18_0.05_55)]"
            activeBorder="border-[oklch(0.38_0.12_55)]"
            inactiveColor="text-[oklch(0.50_0.04_220)]"
          />
          <IndicatorBadge
            label="Mobile Network"
            active={d.mobile}
            activeColor="text-[oklch(0.72_0.18_195)]"
            activeBg="bg-[oklch(0.16_0.04_195)]"
            activeBorder="border-[oklch(0.35_0.10_195)]"
            inactiveColor="text-[oklch(0.50_0.04_220)]"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shodan Panel content ─────────────────────────────────────────────────────

function ShodanContent({
  source,
}: { source: IntelSource<ShodanInternetDBResult> }) {
  if (source.status === "error") {
    return (
      <div className="pt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{source.error}</span>
      </div>
    );
  }
  if (source.status !== "success" || !source.data) {
    return null;
  }

  const d = source.data;
  const hasData =
    d.ports.length > 0 ||
    d.cpes.length > 0 ||
    d.hostnames.length > 0 ||
    d.vulns.length > 0 ||
    d.tags.length > 0;

  if (!hasData) {
    return (
      <div className="pt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.55_0.06_220)]">
        <Shield className="w-3.5 h-3.5" />
        <span>
          No Shodan data found for this IP — target not indexed or private
          range.
        </span>
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-4">
      {/* Open ports */}
      {d.ports.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2 flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5" />
            Open Ports ({d.ports.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {d.ports.map((port) => (
              <span
                key={port}
                className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[oklch(0.16_0.04_195)] text-[oklch(0.72_0.18_195)] border border-[oklch(0.33_0.09_195)]"
              >
                {port}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hostnames */}
      {d.hostnames.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            Hostnames
          </p>
          <div className="flex flex-col gap-1">
            {d.hostnames.map((h) => (
              <span
                key={h}
                className="font-mono text-xs text-[oklch(0.70_0.06_220)]"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CPEs */}
      {d.cpes.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2">
            CPEs (Software)
          </p>
          <div className="flex flex-col gap-1">
            {d.cpes.map((cpe) => (
              <span
                key={cpe}
                className="font-mono text-[10px] text-[oklch(0.65_0.08_155)] bg-[oklch(0.14_0.02_155_/_0.4)] px-2 py-0.5 rounded"
              >
                {cpe}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {d.tags.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {d.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded font-mono text-[10px] bg-[oklch(0.18_0.03_290)] text-[oklch(0.76_0.18_290)] border border-[oklch(0.35_0.10_290)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vulns */}
      {d.vulns.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2 flex items-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5 text-[oklch(0.75_0.22_25)]" />
            Known Vulnerabilities ({d.vulns.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {d.vulns.map((cve) => (
              <a
                key={cve}
                href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.20_0.06_25)] text-[oklch(0.75_0.22_25)] border border-[oklch(0.38_0.14_25)] hover:border-[oklch(0.55_0.20_25)] transition-colors"
              >
                {cve}
                <ExternalLink className="w-2 h-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OTX Panel content ────────────────────────────────────────────────────────

function OtxContent({ source }: { source: IntelSource<OtxResult> }) {
  if (source.status === "error") {
    return (
      <div className="pt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{source.error}</span>
      </div>
    );
  }
  if (source.status !== "success" || !source.data) {
    return null;
  }

  const d = source.data;

  return (
    <div className="pt-3 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded p-3 border bg-[oklch(0.14_0.03_290)] border-[oklch(0.30_0.08_290)] text-center">
          <div className="font-mono text-2xl font-black text-[oklch(0.76_0.18_290)]">
            {d.pulse_info.count}
          </div>
          <div className="font-mono text-[10px] text-[oklch(0.50_0.04_220)] uppercase tracking-wider mt-0.5">
            Threat Pulses
          </div>
        </div>
        <div
          className={`rounded p-3 border text-center ${
            d.reputation > 0
              ? "bg-[oklch(0.18_0.06_25)] border-[oklch(0.35_0.12_25)]"
              : "bg-[oklch(0.14_0.02_155)] border-[oklch(0.30_0.08_155)]"
          }`}
        >
          <div
            className={`font-mono text-2xl font-black ${
              d.reputation > 0
                ? "text-[oklch(0.75_0.22_25)]"
                : "text-[oklch(0.72_0.18_155)]"
            }`}
          >
            {d.reputation}
          </div>
          <div className="font-mono text-[10px] text-[oklch(0.50_0.04_220)] uppercase tracking-wider mt-0.5">
            Reputation
          </div>
        </div>
      </div>

      {/* Pulses or clean state */}
      {d.pulse_info.count === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded bg-[oklch(0.14_0.03_155)] border border-[oklch(0.30_0.08_155)]">
          <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.18_155)] flex-shrink-0" />
          <p className="font-mono text-xs text-[oklch(0.68_0.12_155)]">
            No threat pulses found — target appears clean in OTX community
            threat database.
          </p>
        </div>
      ) : (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2">
            Top Threat Pulses
          </p>
          <div className="space-y-2">
            {d.pulse_info.pulses.slice(0, 3).map((pulse, i) => (
              <div
                key={pulse.id || i}
                className="rounded p-3 bg-[oklch(0.14_0.02_240)] border border-[oklch(0.26_0.03_220)]"
              >
                <div className="flex items-start gap-2 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[oklch(0.78_0.20_55)] mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-xs font-semibold text-[oklch(0.80_0.04_220)]">
                    {pulse.name}
                  </p>
                </div>
                {pulse.description && (
                  <p className="font-mono text-[10px] text-[oklch(0.55_0.03_220)] line-clamp-2 mb-2 ml-5">
                    {pulse.description}
                  </p>
                )}
                <div className="ml-5 flex flex-wrap gap-1">
                  {pulse.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-[oklch(0.18_0.03_290)] text-[oklch(0.70_0.14_290)] border border-[oklch(0.30_0.07_290)]"
                    >
                      {tag}
                    </span>
                  ))}
                  {pulse.adversary && (
                    <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-[oklch(0.18_0.05_25)] text-[oklch(0.70_0.18_25)] border border-[oklch(0.32_0.10_25)]">
                      APT: {pulse.adversary}
                    </span>
                  )}
                </div>
                {pulse.created && (
                  <p className="mt-1 ml-5 font-mono text-[9px] text-[oklch(0.42_0.03_220)]">
                    {new Date(pulse.created).toLocaleDateString()}
                    {pulse.author_name ? ` · by ${pulse.author_name}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function DataCell({
  label,
  value,
  mono,
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded px-2.5 py-2 bg-[oklch(0.12_0.01_240)] border border-[oklch(0.22_0.02_220)]">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.42_0.03_220)] mb-0.5">
        {label}
      </p>
      <p
        className={`text-xs text-[oklch(0.80_0.03_220)] break-all ${mono ? "font-mono" : "font-sans"}`}
      >
        {value}
      </p>
    </div>
  );
}

function IndicatorBadge({
  label,
  active,
  activeColor,
  activeBg,
  activeBorder,
  inactiveColor,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  inactiveColor: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs font-bold border transition-all ${
        active
          ? `${activeBg} ${activeColor} ${activeBorder}`
          : `bg-[oklch(0.14_0.01_240)] ${inactiveColor} border-[oklch(0.24_0.02_220)] opacity-50`
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-current" : "bg-current opacity-40"}`}
      />
      {label}: {active ? "YES" : "NO"}
    </span>
  );
}

// ─── History entry ────────────────────────────────────────────────────────────

interface HistoryEntry {
  target: string;
  timestamp: number;
  pulseCount: number;
  portCount: number;
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function IntelFetchDashboard() {
  const [target, setTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntelResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleFetch = useCallback(
    async (overrideTarget?: string) => {
      const t = (overrideTarget ?? target).trim();
      if (!t) {
        setError("Enter an IP address or domain name");
        return;
      }

      setError("");
      setIsLoading(true);
      setResult(null);

      try {
        const data = await runIntelFetch(t);
        setResult(data);

        setHistory((prev) => {
          const entry: HistoryEntry = {
            target: t,
            timestamp: Date.now(),
            pulseCount: data.otx.data?.pulse_info.count ?? 0,
            portCount: data.shodan.data?.ports.length ?? 0,
          };
          return [entry, ...prev.filter((h) => h.target !== t)].slice(0, 5);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Intel fetch failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [target],
  );

  const quickTargets = [
    { label: "8.8.8.8", hint: "Google DNS" },
    { label: "1.1.1.1", hint: "Cloudflare DNS" },
    { label: "scanme.nmap.org", hint: "nmap test host" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Input section ──────────────────────────────────────────────────── */}
      <div className="rounded-lg p-6 bg-[oklch(0.16_0.015_235)] border border-[oklch(0.35_0.09_290)] shadow-[0_0_12px_oklch(0.76_0.18_290_/_0.08)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded bg-[oklch(0.14_0.02_290)] border border-[oklch(0.38_0.10_290)]">
            <Radio className="w-5 h-5 text-[oklch(0.76_0.18_290)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[oklch(0.76_0.18_290)] font-mono uppercase tracking-widest">
              Intel Fetch
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Passive OSINT intelligence from ip-api, Shodan &amp; AlienVault
              OTX
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[oklch(0.14_0.02_240)] border border-[oklch(0.28_0.04_220)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.76_0.18_290)] blink" />
            <span className="font-mono text-[10px] text-[oklch(0.55_0.04_220)]">
              3 SOURCES
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label
              htmlFor="intel-target-input"
              className="block font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)] mb-1.5"
            >
              IP Address or Domain{" "}
              <span className="text-[oklch(0.75_0.22_25)]">*</span>
            </label>
            <Input
              id="intel-target-input"
              data-ocid="intel.input"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) handleFetch();
              }}
              placeholder="192.168.1.1 or example.com"
              disabled={isLoading}
              className="font-mono bg-[oklch(0.12_0.01_240)] border-[oklch(0.28_0.04_220)] text-[oklch(0.85_0.02_220)] placeholder:text-muted-foreground/40 focus:border-[oklch(0.55_0.14_290)] h-11 text-sm"
            />
          </div>
          <div className="flex-shrink-0 self-end">
            <Button
              data-ocid="intel.primary_button"
              onClick={() => handleFetch()}
              disabled={isLoading || !target.trim()}
              className="h-11 px-5 bg-[oklch(0.60_0.16_290)] text-white hover:bg-[oklch(0.68_0.18_290)] font-mono font-bold uppercase tracking-wider border-0 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isLoading ? "Fetching..." : "Fetch All Intel"}
              </span>
            </Button>
          </div>
        </div>

        <p className="mt-2.5 font-mono text-[10px] text-[oklch(0.45_0.04_220)]">
          <span className="text-[oklch(0.50_0.10_290)]">{"//"} </span>
          Queries ip-api.com (geolocation), Shodan InternetDB (ports/vulns), and
          AlienVault OTX (threat intel) in parallel.
        </p>

        {/* Error */}
        {error && (
          <div
            data-ocid="intel.error_state"
            className="mt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => handleFetch()}
              className="ml-auto flex items-center gap-1 text-[oklch(0.60_0.12_290)] hover:text-[oklch(0.76_0.18_290)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Quick targets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-[oklch(0.45_0.04_220)]">
            Quick lookup:
          </span>
          {quickTargets.map(({ label, hint }) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                setTarget(label);
                handleFetch(label);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs bg-[oklch(0.16_0.015_240)] border border-[oklch(0.28_0.04_220)] text-[oklch(0.65_0.10_290)] hover:border-[oklch(0.42_0.12_290)] hover:bg-[oklch(0.18_0.02_240)] transition-all"
            >
              <Cpu className="w-2.5 h-2.5" />
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
            data-ocid="intel.loading_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg p-12 flex flex-col items-center justify-center gap-4 bg-[oklch(0.14_0.015_240)] border border-[oklch(0.35_0.09_290)] shadow-[0_0_12px_oklch(0.76_0.18_290_/_0.08)]"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border border-[oklch(0.35_0.09_290)] flex items-center justify-center">
                <Radio className="w-8 h-8 text-[oklch(0.55_0.12_290)] scan-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-t-[oklch(0.76_0.18_290)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-semibold text-[oklch(0.76_0.18_290)]">
                Scanning intelligence sources...
              </p>
              <p className="font-mono text-xs text-[oklch(0.50_0.04_220)] mt-1">
                Querying ip-api · Shodan · AlienVault OTX for{" "}
                <span className="text-[oklch(0.70_0.12_290)]">{target}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Target summary bar */}
            <div className="rounded-lg px-4 py-3 bg-[oklch(0.14_0.02_290)] border border-[oklch(0.30_0.08_290)] flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[oklch(0.76_0.18_290)]" />
                <span className="font-mono text-xs font-bold text-[oklch(0.76_0.18_290)]">
                  {result.target}
                </span>
              </div>
              {result.resolvedIp && result.resolvedIp !== result.target && (
                <Badge className="font-mono text-[10px] bg-[oklch(0.16_0.03_195)] text-[oklch(0.65_0.12_195)] border border-[oklch(0.32_0.08_195)] hover:bg-[oklch(0.16_0.03_195)]">
                  Resolved: {result.resolvedIp}
                </Badge>
              )}
              <span className="ml-auto font-mono text-[10px] text-[oklch(0.45_0.04_220)] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(result.fetchedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Panel 1 — IP Geolocation */}
            <IntelPanel
              title="IP Geolocation & ASN (ip-api.com)"
              icon={
                <MapPin className="w-3.5 h-3.5 text-[oklch(0.72_0.18_195)]" />
              }
              accentClass="text-[oklch(0.72_0.18_195)]"
              borderClass="border-[oklch(0.35_0.09_195)]"
              bgClass="bg-[oklch(0.13_0.015_240)]"
              status={result.ipApi.status}
              copyData={result.ipApi.data}
              copyOcid="intel.source1.button"
              defaultExpanded
            >
              <IpIntelContent source={result.ipApi} />
            </IntelPanel>

            {/* Panel 2 — Shodan InternetDB */}
            <IntelPanel
              title="Shodan InternetDB (Ports & Vulns)"
              icon={
                <Server className="w-3.5 h-3.5 text-[oklch(0.72_0.18_155)]" />
              }
              accentClass="text-[oklch(0.72_0.18_155)]"
              borderClass="border-[oklch(0.35_0.09_155)]"
              bgClass="bg-[oklch(0.13_0.015_240)]"
              status={result.shodan.status}
              copyData={result.shodan.data}
              copyOcid="intel.source2.button"
              defaultExpanded
            >
              <ShodanContent source={result.shodan} />
            </IntelPanel>

            {/* Panel 3 — AlienVault OTX */}
            <IntelPanel
              title="AlienVault OTX (Threat Intelligence)"
              icon={
                <ShieldAlert className="w-3.5 h-3.5 text-[oklch(0.76_0.18_290)]" />
              }
              accentClass="text-[oklch(0.76_0.18_290)]"
              borderClass="border-[oklch(0.35_0.09_290)]"
              bgClass="bg-[oklch(0.13_0.015_240)]"
              status={result.otx.status}
              copyData={result.otx.data}
              copyOcid="intel.source3.button"
              defaultExpanded
            >
              <OtxContent source={result.otx} />
            </IntelPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty initial state ─────────────────────────────────────────────── */}
      {!result && !isLoading && !error && (
        <div className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-[oklch(0.14_0.03_290)] border border-[oklch(0.35_0.10_290)] flex items-center justify-center">
              <Radio className="w-10 h-10 text-[oklch(0.50_0.12_290)]" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.18_0.04_290)] border border-[oklch(0.40_0.12_290)] flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-[oklch(0.76_0.18_290)]" />
            </div>
          </div>
          <h3 className="font-mono text-lg font-semibold text-[oklch(0.75_0.04_220)] mb-2">
            Intelligence Awaiting Target
          </h3>
          <p className="font-mono text-sm text-[oklch(0.50_0.04_220)] max-w-md">
            Enter an IP address or domain name above to gather passive OSINT
            from three independent intelligence sources simultaneously.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
            {[
              {
                label: "ip-api.com",
                desc: "Geolocation, ISP, ASN, proxy/hosting detection",
                color: "text-[oklch(0.65_0.12_195)]",
                border: "border-[oklch(0.28_0.06_195)]",
                bg: "bg-[oklch(0.14_0.02_195_/_0.3)]",
              },
              {
                label: "Shodan InternetDB",
                desc: "Open ports, CPEs, hostnames, known CVEs",
                color: "text-[oklch(0.65_0.12_155)]",
                border: "border-[oklch(0.28_0.06_155)]",
                bg: "bg-[oklch(0.14_0.02_155_/_0.3)]",
              },
              {
                label: "AlienVault OTX",
                desc: "Community threat pulses, reputation, adversary tracking",
                color: "text-[oklch(0.65_0.12_290)]",
                border: "border-[oklch(0.28_0.06_290)]",
                bg: "bg-[oklch(0.14_0.02_290_/_0.3)]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-4 py-3 rounded ${item.bg} border ${item.border} text-left`}
              >
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
                key={`${entry.target}-${entry.timestamp}`}
                data-ocid={`intel.item.${i + 1}`}
                onClick={() => {
                  setTarget(entry.target);
                  handleFetch(entry.target);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[oklch(0.15_0.015_240)] border border-[oklch(0.26_0.03_220)] hover:border-[oklch(0.38_0.08_290)] transition-all group"
              >
                <Cpu className="w-2.5 h-2.5 text-[oklch(0.55_0.08_290)] group-hover:text-[oklch(0.72_0.14_290)]" />
                <span className="font-mono text-xs text-[oklch(0.70_0.08_220)] group-hover:text-[oklch(0.80_0.10_220)]">
                  {entry.target}
                </span>
                {entry.portCount > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] font-mono bg-[oklch(0.18_0.03_195)] text-[oklch(0.62_0.10_195)] border-[oklch(0.30_0.06_195)] hover:bg-[oklch(0.18_0.03_195)]">
                    {entry.portCount}p
                  </Badge>
                )}
                {entry.pulseCount > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] font-mono bg-[oklch(0.20_0.05_25)] text-[oklch(0.70_0.16_25)] border-[oklch(0.32_0.09_25)] hover:bg-[oklch(0.20_0.05_25)]">
                    {entry.pulseCount}⚠
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
