import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import {
  type CveItem,
  type CveSearchResult,
  type SeverityLevel,
  getCvssScore,
  getDescription,
  getKeyReferences,
  getPublishedDate,
  hasExploit,
  hasPatch,
  searchCves,
} from "../services/cveApi";

interface SearchHistoryEntry {
  software: string;
  version: string;
  timestamp: number;
  total: number;
}

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; bg: string; text: string; border: string; glow: string }
> = {
  CRITICAL: {
    label: "CRITICAL",
    bg: "bg-[oklch(0.25_0.08_25)]",
    text: "text-[oklch(0.75_0.22_25)]",
    border: "border-[oklch(0.45_0.18_25)]",
    glow: "shadow-[0_0_8px_oklch(0.62_0.22_25_/_0.4)]",
  },
  HIGH: {
    label: "HIGH",
    bg: "bg-[oklch(0.25_0.08_55)]",
    text: "text-[oklch(0.78_0.20_55)]",
    border: "border-[oklch(0.45_0.16_55)]",
    glow: "shadow-[0_0_8px_oklch(0.70_0.20_55_/_0.3)]",
  },
  MEDIUM: {
    label: "MEDIUM",
    bg: "bg-[oklch(0.25_0.07_85)]",
    text: "text-[oklch(0.82_0.18_85)]",
    border: "border-[oklch(0.45_0.14_85)]",
    glow: "shadow-[0_0_8px_oklch(0.75_0.18_85_/_0.25)]",
  },
  LOW: {
    label: "LOW",
    bg: "bg-[oklch(0.20_0.04_155)]",
    text: "text-[oklch(0.72_0.18_155)]",
    border: "border-[oklch(0.40_0.14_155)]",
    glow: "shadow-[0_0_8px_oklch(0.65_0.18_155_/_0.2)]",
  },
  NONE: {
    label: "N/A",
    bg: "bg-[oklch(0.20_0.02_240)]",
    text: "text-[oklch(0.60_0.03_240)]",
    border: "border-[oklch(0.30_0.03_240)]",
    glow: "",
  },
};

function SeverityBadge({
  severity,
  score,
}: { severity: SeverityLevel; score: number }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.glow}`}
    >
      <span className="text-base leading-none">
        {score > 0 ? score.toFixed(1) : "—"}
      </span>
      <span className="opacity-70">{cfg.label}</span>
    </span>
  );
}

function ExploitBadge({ available }: { available: boolean }) {
  if (!available) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.22_0.06_290)] text-[oklch(0.76_0.18_290)] border border-[oklch(0.40_0.14_290)]">
      <Bug className="w-2.5 h-2.5" />
      EXPLOIT
    </span>
  );
}

function PatchBadge({ available }: { available: boolean }) {
  if (!available) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[oklch(0.20_0.04_155)] text-[oklch(0.72_0.18_155)] border border-[oklch(0.38_0.12_155)]">
      <ShieldCheck className="w-2.5 h-2.5" />
      PATCH
    </span>
  );
}

function CveCard({ cve, index }: { cve: CveItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { score, severity } = getCvssScore(cve);
  const exploit = hasExploit(cve);
  const patch = hasPatch(cve);
  const description = getDescription(cve);
  const published = getPublishedDate(cve);
  const refs = getKeyReferences(cve);

  const markerIndex = index + 1;

  return (
    <motion.div
      data-ocid={`cve.item.${markerIndex}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-lg border overflow-hidden transition-shadow duration-200 ${
        severity === "CRITICAL"
          ? "border-[oklch(0.38_0.14_25)] bg-[oklch(0.12_0.015_25)] hover:border-[oklch(0.50_0.18_25)]"
          : severity === "HIGH"
            ? "border-[oklch(0.32_0.10_55)] bg-[oklch(0.12_0.012_55)] hover:border-[oklch(0.44_0.14_55)]"
            : severity === "MEDIUM"
              ? "border-[oklch(0.30_0.08_85)] bg-[oklch(0.12_0.010_85)] hover:border-[oklch(0.42_0.12_85)]"
              : "border-[oklch(0.28_0.05_220)] bg-[oklch(0.12_0.012_240)] hover:border-[oklch(0.36_0.08_220)]"
      }`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          {/* CVE ID */}
          <a
            href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-sm font-bold text-[oklch(0.72_0.18_195)] hover:text-[oklch(0.82_0.20_195)] transition-colors group"
          >
            {cve.id}
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <SeverityBadge severity={severity} score={score} />
            <ExploitBadge available={exploit} />
            <PatchBadge available={patch} />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 font-mono text-[10px] text-[oklch(0.50_0.04_220)]">
            <Clock className="w-2.5 h-2.5" />
            {published}
          </span>
        </div>

        {/* Description */}
        <p
          className={`font-mono text-xs text-[oklch(0.72_0.02_220)] leading-relaxed ${
            !expanded ? "line-clamp-3" : ""
          }`}
        >
          {description}
        </p>

        {description.length > 220 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 font-mono text-[10px] text-[oklch(0.60_0.12_195)] hover:text-[oklch(0.72_0.18_195)] transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* References */}
      {refs.length > 0 && (
        <div className="px-4 pb-4 border-t border-[oklch(0.22_0.03_220_/_0.4)] pt-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[oklch(0.45_0.04_220)] mb-2">
            References
          </p>
          <div className="flex flex-col gap-1.5">
            {refs.map((ref) => {
              const tags = ref.tags || [];
              const isExploit = tags.some((t) =>
                t.toLowerCase().includes("exploit"),
              );
              const isPatch = tags.some((t) =>
                ["patch", "vendor advisory", "fix"].includes(t.toLowerCase()),
              );
              return (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-2 group text-[10px] font-mono hover:opacity-90 transition-opacity ${
                    isExploit
                      ? "text-[oklch(0.70_0.15_290)]"
                      : isPatch
                        ? "text-[oklch(0.68_0.14_155)]"
                        : "text-[oklch(0.55_0.06_220)]"
                  }`}
                >
                  <ExternalLink className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  <span className="truncate">{ref.url}</span>
                  {tags.length > 0 && (
                    <span className="flex-shrink-0 opacity-60">
                      [{tags.slice(0, 2).join(", ")}]
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatsPanel({ result }: { result: CveSearchResult }) {
  return (
    <motion.div
      data-ocid="cve.stats_panel"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-5 gap-3"
    >
      {[
        {
          label: "Total CVEs",
          value: result.total,
          colorClass: "text-[oklch(0.72_0.18_195)]",
          bgClass: "bg-[oklch(0.14_0.015_240)]",
          borderClass: "border-[oklch(0.30_0.05_220)]",
        },
        {
          label: "Critical",
          value: result.criticalCount,
          colorClass: "text-[oklch(0.75_0.22_25)]",
          bgClass: "bg-[oklch(0.14_0.03_25)]",
          borderClass: "border-[oklch(0.30_0.10_25)]",
        },
        {
          label: "High",
          value: result.highCount,
          colorClass: "text-[oklch(0.78_0.20_55)]",
          bgClass: "bg-[oklch(0.14_0.03_55)]",
          borderClass: "border-[oklch(0.30_0.08_55)]",
        },
        {
          label: "Medium",
          value: result.mediumCount,
          colorClass: "text-[oklch(0.82_0.18_85)]",
          bgClass: "bg-[oklch(0.14_0.025_85)]",
          borderClass: "border-[oklch(0.30_0.06_85)]",
        },
        {
          label: "Exploits",
          value: result.exploitCount,
          colorClass: "text-[oklch(0.76_0.18_290)]",
          bgClass: "bg-[oklch(0.14_0.03_290)]",
          borderClass: "border-[oklch(0.30_0.08_290)]",
        },
      ].map(({ label, value, colorClass, bgClass, borderClass }) => (
        <div
          key={label}
          className={`rounded-lg p-3 border ${bgClass} ${borderClass} text-center`}
        >
          <div className={`font-mono text-2xl font-black ${colorClass}`}>
            {value}
          </div>
          <div className="font-mono text-[10px] text-[oklch(0.50_0.04_220)] uppercase tracking-wider mt-0.5">
            {label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function CVEDashboard() {
  const [domain, setDomain] = useState("");
  const [software, setSoftware] = useState("");
  const [version, setVersion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CveSearchResult | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  const handleSearch = useCallback(
    async (sw?: string, ver?: string) => {
      const swValue = (sw ?? software).trim();
      const verValue = (ver ?? version).trim();

      if (!swValue) {
        setError("Please enter a software name");
        return;
      }

      setError("");
      setIsLoading(true);
      setResult(null);
      setSeverityFilter("ALL");

      try {
        const data = await searchCves(swValue, verValue);
        setResult(data);

        setHistory((prev) => {
          const entry: SearchHistoryEntry = {
            software: swValue,
            version: verValue,
            timestamp: Date.now(),
            total: data.total,
          };
          return [
            entry,
            ...prev.filter(
              (h) => !(h.software === swValue && h.version === verValue),
            ),
          ].slice(0, 5);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to query NVD database. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [software, version],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleSearch();
  };

  const filteredItems = result
    ? severityFilter === "ALL"
      ? result.items
      : result.items.filter((item) => {
          const { severity } = getCvssScore(item);
          return severity === severityFilter;
        })
    : [];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="cyber-card-cyan rounded-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded bg-cyber-surface2 border border-[oklch(0.40_0.12_195)]">
            <Database className="w-5 h-5 text-[oklch(0.72_0.18_195)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[oklch(0.72_0.18_195)] font-mono uppercase tracking-widest">
              CVE Intelligence Search
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Query NVD database for known vulnerabilities
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[oklch(0.14_0.02_240)] border border-[oklch(0.28_0.04_220)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_155)] blink" />
            <span className="font-mono text-[10px] text-[oklch(0.55_0.04_220)]">
              NVD LIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Domain input (optional context) */}
          <div className="relative">
            <label
              htmlFor="cve-domain-input"
              className="block font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)] mb-1.5"
            >
              Target Domain (optional)
            </label>
            <Input
              id="cve-domain-input"
              data-ocid="recon.input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="font-mono bg-cyber-surface1 border-[oklch(0.28_0.04_220)] text-[oklch(0.85_0.02_220)] placeholder:text-muted-foreground/40 focus:border-[oklch(0.55_0.12_195)] h-11 text-sm"
            />
          </div>

          {/* Software input */}
          <div className="relative">
            <label
              htmlFor="cve-software-input"
              className="block font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)] mb-1.5"
            >
              Software Name{" "}
              <span className="text-[oklch(0.75_0.22_25)]">*</span>
            </label>
            <Input
              id="cve-software-input"
              data-ocid="cve.software_input"
              value={software}
              onChange={(e) => {
                setSoftware(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Apache, OpenSSL, nginx..."
              disabled={isLoading}
              className="font-mono bg-cyber-surface1 border-[oklch(0.28_0.04_220)] text-[oklch(0.85_0.02_220)] placeholder:text-muted-foreground/40 focus:border-[oklch(0.55_0.12_195)] h-11 text-sm"
            />
          </div>

          {/* Version input */}
          <div className="relative">
            <label
              htmlFor="cve-version-input"
              className="block font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)] mb-1.5"
            >
              Version
            </label>
            <div className="flex gap-2">
              <Input
                id="cve-version-input"
                data-ocid="cve.version_input"
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="2.4.51"
                disabled={isLoading}
                className="font-mono bg-cyber-surface1 border-[oklch(0.28_0.04_220)] text-[oklch(0.85_0.02_220)] placeholder:text-muted-foreground/40 focus:border-[oklch(0.55_0.12_195)] h-11 text-sm"
              />
              <Button
                data-ocid="cve.submit_button"
                onClick={() => handleSearch()}
                disabled={isLoading || !software.trim()}
                className="h-11 px-5 bg-[oklch(0.65_0.18_195)] text-[oklch(0.08_0.01_240)] hover:bg-[oklch(0.72_0.20_195)] font-mono font-bold uppercase tracking-wider border-0 shadow-neon-cyan disabled:opacity-40 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] text-[oklch(0.45_0.04_220)]">
          <span className="text-[oklch(0.50_0.10_195)]">{"//"} </span>
          Enter software name + version to search the NVD database (National
          Vulnerability Database)
        </p>

        {error && (
          <div
            data-ocid="cve.error_state"
            className="mt-3 flex items-center gap-2 text-xs font-mono text-[oklch(0.75_0.22_25)]"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => handleSearch()}
              className="ml-auto flex items-center gap-1 text-[oklch(0.60_0.12_195)] hover:text-[oklch(0.72_0.18_195)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            data-ocid="cve.loading_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-card-cyan rounded-lg p-12 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border border-[oklch(0.40_0.12_195)] flex items-center justify-center">
                <Database className="w-8 h-8 text-[oklch(0.60_0.14_195)] scan-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-t-[oklch(0.72_0.18_195)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-semibold text-[oklch(0.72_0.18_195)]">
                Querying NVD database...
              </p>
              <p className="font-mono text-xs text-[oklch(0.50_0.04_220)] mt-1">
                Searching for {software}
                {version ? ` ${version}` : ""} vulnerabilities
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Stats bar */}
            <StatsPanel result={result} />

            {/* Severity filter */}
            <Tabs value={severityFilter} onValueChange={setSeverityFilter}>
              <TabsList
                data-ocid="cve.filter.tab"
                className="bg-[oklch(0.13_0.012_240)] border border-[oklch(0.28_0.04_220)] h-auto p-1 gap-1 flex-wrap"
              >
                {[
                  {
                    value: "ALL",
                    label: `All (${result.items.length})`,
                    color: "text-[oklch(0.65_0.10_195)]",
                  },
                  {
                    value: "CRITICAL",
                    label: `Critical (${result.criticalCount})`,
                    color: "text-[oklch(0.72_0.20_25)]",
                  },
                  {
                    value: "HIGH",
                    label: `High (${result.highCount})`,
                    color: "text-[oklch(0.75_0.18_55)]",
                  },
                  {
                    value: "MEDIUM",
                    label: `Medium (${result.mediumCount})`,
                    color: "text-[oklch(0.78_0.16_85)]",
                  },
                  {
                    value: "LOW",
                    label: `Low (${result.lowCount})`,
                    color: "text-[oklch(0.68_0.14_155)]",
                  },
                ].map(({ value, label, color }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`font-mono text-xs px-3 py-1.5 rounded data-[state=active]:bg-[oklch(0.18_0.015_240)] data-[state=active]:shadow-none ${color}`}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={severityFilter} className="mt-4">
                {filteredItems.length === 0 ? (
                  <div
                    data-ocid="cve.empty_state"
                    className="cyber-card rounded-lg p-10 flex flex-col items-center justify-center text-center"
                  >
                    <Shield className="w-12 h-12 text-[oklch(0.40_0.08_195)] mb-4" />
                    <p className="font-mono text-sm font-semibold text-[oklch(0.60_0.06_220)]">
                      No CVEs found for this search
                    </p>
                    <p className="font-mono text-xs text-[oklch(0.45_0.04_220)] mt-2 max-w-sm">
                      Try a different software name, version, or severity
                      filter. The NVD database may not have entries for this
                      exact version.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((cve, i) => (
                      <CveCard key={cve.id} cve={cve} index={i} />
                    ))}
                    {result.total > result.items.length && (
                      <p className="font-mono text-[10px] text-center text-[oklch(0.45_0.04_220)] py-2">
                        Showing {result.items.length} of {result.total} total
                        results — use a more specific version for complete
                        results
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty initial state */}
      {!result && !isLoading && !error && (
        <div className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-[oklch(0.14_0.02_195)] border border-[oklch(0.35_0.10_195)] flex items-center justify-center">
              <Shield className="w-10 h-10 text-[oklch(0.50_0.12_195)]" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.20_0.04_195)] border border-[oklch(0.40_0.12_195)] flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-[oklch(0.72_0.18_195)]" />
            </div>
          </div>
          <h3 className="font-mono text-lg font-semibold text-[oklch(0.75_0.04_220)] mb-2">
            CVE Intelligence Ready
          </h3>
          <p className="font-mono text-sm text-[oklch(0.50_0.04_220)] max-w-md">
            Enter a software name and version to search the NVD for known CVEs,
            CVSS scores, exploit availability, and patch status.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
            {[
              { label: "CVSS Scoring", desc: "v3.1 / v3.0 / v2" },
              { label: "Exploit Refs", desc: "exploit-db & PoC links" },
              { label: "Patch Status", desc: "Vendor advisories" },
              { label: "Severity Filter", desc: "Critical / High / Medium" },
              { label: "CVE Timeline", desc: "Published & modified dates" },
              { label: "References", desc: "Prioritized links" },
            ].map((item) => (
              <div
                key={item.label}
                className="px-3 py-2.5 rounded bg-cyber-surface1 border border-[oklch(0.25_0.03_220)] text-left"
              >
                <div className="font-mono text-xs font-semibold text-[oklch(0.65_0.12_195)]">
                  {item.label}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Quick examples */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <p className="w-full font-mono text-[10px] text-[oklch(0.45_0.04_220)] mb-1">
              Quick searches:
            </p>
            {[
              { sw: "Apache", ver: "2.4.49" },
              { sw: "OpenSSL", ver: "1.1.1" },
              { sw: "Log4j", ver: "2.14.1" },
              { sw: "nginx", ver: "1.20" },
            ].map(({ sw, ver }) => (
              <button
                type="button"
                key={sw + ver}
                onClick={() => {
                  setSoftware(sw);
                  setVersion(ver);
                  handleSearch(sw, ver);
                }}
                className="px-3 py-1 rounded font-mono text-xs bg-[oklch(0.16_0.015_240)] border border-[oklch(0.28_0.04_220)] text-[oklch(0.65_0.10_195)] hover:border-[oklch(0.40_0.10_195)] hover:bg-[oklch(0.18_0.02_240)] transition-all"
              >
                {sw} {ver}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div className="cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-[oklch(0.55_0.06_220)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[oklch(0.50_0.05_220)]">
              Recent Searches
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((entry, i) => (
              <button
                type="button"
                key={`${entry.software}-${entry.version}-${entry.timestamp}`}
                data-ocid={`history.item.${i + 1}`}
                onClick={() => {
                  setSoftware(entry.software);
                  setVersion(entry.version);
                  handleSearch(entry.software, entry.version);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[oklch(0.15_0.015_240)] border border-[oklch(0.26_0.03_220)] hover:border-[oklch(0.38_0.08_195)] transition-all group"
              >
                <span className="font-mono text-xs text-[oklch(0.70_0.08_220)] group-hover:text-[oklch(0.80_0.10_220)]">
                  {entry.software} {entry.version}
                </span>
                {entry.total > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] font-mono bg-[oklch(0.20_0.03_195)] text-[oklch(0.65_0.12_195)] border-[oklch(0.30_0.06_195)] hover:bg-[oklch(0.20_0.03_195)]">
                    {entry.total}
                  </Badge>
                )}
                <AlertTriangle className="w-2.5 h-2.5 text-[oklch(0.55_0.10_195)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
