import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  ShieldCheck,
  ShieldX,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type OWASPCheckResult,
  type OWASPReport,
  runOWASPChecks,
} from "../services/owaspApi";

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusIcon({
  status,
}: {
  status: OWASPCheckResult["status"];
}) {
  if (status === "pass")
    return <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.20_145)]" />;
  if (status === "fail")
    return <XCircle className="w-4 h-4 text-[oklch(0.65_0.22_25)]" />;
  if (status === "warning")
    return <AlertTriangle className="w-4 h-4 text-[oklch(0.78_0.18_75)]" />;
  if (status === "loading")
    return (
      <Loader2 className="w-4 h-4 text-[oklch(0.72_0.18_195)] animate-spin" />
    );
  if (status === "error")
    return <ShieldX className="w-4 h-4 text-[oklch(0.60_0.20_45)]" />;
  return <Info className="w-4 h-4 text-[oklch(0.60_0.14_220)]" />;
}

function RiskBadge({ level }: { level: OWASPCheckResult["riskLevel"] }) {
  const styles: Record<OWASPCheckResult["riskLevel"], string> = {
    CRITICAL:
      "bg-[oklch(0.18_0.04_25)] border-[oklch(0.45_0.20_25)] text-[oklch(0.75_0.22_25)]",
    HIGH: "bg-[oklch(0.18_0.04_45)] border-[oklch(0.45_0.18_45)] text-[oklch(0.78_0.20_55)]",
    MEDIUM:
      "bg-[oklch(0.18_0.04_75)] border-[oklch(0.45_0.16_75)] text-[oklch(0.82_0.18_85)]",
    LOW: "bg-[oklch(0.15_0.03_145)] border-[oklch(0.40_0.14_145)] text-[oklch(0.72_0.18_155)]",
    INFO: "bg-[oklch(0.15_0.03_220)] border-[oklch(0.38_0.12_220)] text-[oklch(0.65_0.14_220)]",
  };
  return (
    <span
      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${styles[level]}`}
    >
      {level}
    </span>
  );
}

function FindingStatusDot({
  status,
}: {
  status: "pass" | "fail" | "warning" | "info";
}) {
  const colors = {
    pass: "bg-[oklch(0.72_0.20_145)]",
    fail: "bg-[oklch(0.65_0.22_25)]",
    warning: "bg-[oklch(0.78_0.18_75)]",
    info: "bg-[oklch(0.60_0.14_220)]",
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[status]}`}
    />
  );
}

function GradeBadge({
  grade,
  score,
}: {
  grade: string;
  score: number;
}) {
  const gradeStyles: Record<
    string,
    { bg: string; border: string; text: string; glow: string }
  > = {
    "A+": {
      bg: "bg-[oklch(0.14_0.04_145)]",
      border: "border-[oklch(0.45_0.18_145)]",
      text: "text-[oklch(0.72_0.20_145)]",
      glow: "oklch(0.72 0.20 145 / 0.4)",
    },
    A: {
      bg: "bg-[oklch(0.14_0.03_155)]",
      border: "border-[oklch(0.42_0.16_155)]",
      text: "text-[oklch(0.72_0.18_155)]",
      glow: "oklch(0.72 0.18 155 / 0.4)",
    },
    B: {
      bg: "bg-[oklch(0.14_0.03_195)]",
      border: "border-[oklch(0.40_0.14_195)]",
      text: "text-[oklch(0.72_0.18_195)]",
      glow: "oklch(0.72 0.18 195 / 0.35)",
    },
    C: {
      bg: "bg-[oklch(0.16_0.04_75)]",
      border: "border-[oklch(0.45_0.16_75)]",
      text: "text-[oklch(0.82_0.18_85)]",
      glow: "oklch(0.82 0.18 85 / 0.35)",
    },
    D: {
      bg: "bg-[oklch(0.16_0.04_55)]",
      border: "border-[oklch(0.45_0.18_55)]",
      text: "text-[oklch(0.78_0.20_55)]",
      glow: "oklch(0.78 0.20 55 / 0.35)",
    },
    F: {
      bg: "bg-[oklch(0.15_0.04_25)]",
      border: "border-[oklch(0.45_0.20_25)]",
      text: "text-[oklch(0.75_0.22_25)]",
      glow: "oklch(0.75 0.22 25 / 0.4)",
    },
  };

  const style = gradeStyles[grade] ?? gradeStyles.F;

  return (
    <div
      className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 ${style.bg} ${style.border}`}
      style={{ boxShadow: `0 0 20px ${style.glow}` }}
    >
      <span className={`font-mono text-3xl font-bold ${style.text}`}>
        {grade}
      </span>
      <span className={`font-mono text-[10px] ${style.text} opacity-70`}>
        {score}/100
      </span>
    </div>
  );
}

function CheckCard({
  check,
  index,
  ocid,
}: {
  check: OWASPCheckResult;
  index: number;
  ocid: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const borderColors: Record<OWASPCheckResult["status"], string> = {
    pass: "border-[oklch(0.40_0.14_145)]",
    fail: "border-[oklch(0.45_0.20_25)]",
    warning: "border-[oklch(0.45_0.16_75)]",
    info: "border-[oklch(0.35_0.08_220)]",
    loading: "border-[oklch(0.38_0.12_195)]",
    error: "border-[oklch(0.40_0.14_45)]",
  };

  const glowColors: Record<OWASPCheckResult["status"], string> = {
    pass: "oklch(0.72 0.20 145 / 0.07)",
    fail: "oklch(0.65 0.22 25 / 0.10)",
    warning: "oklch(0.78 0.18 75 / 0.08)",
    info: "oklch(0.60 0.14 220 / 0.07)",
    loading: "oklch(0.72 0.18 195 / 0.08)",
    error: "oklch(0.70 0.18 45 / 0.08)",
  };

  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`rounded-lg border ${borderColors[check.status]} bg-[oklch(0.13_0.01_240)]`}
      style={{
        boxShadow: `0 0 14px ${glowColors[check.status]}, inset 0 1px 0 oklch(1 0 0 / 0.03)`,
      }}
    >
      {/* Card header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <StatusIcon status={check.status} />
            <span className="font-mono text-sm font-semibold text-foreground truncate">
              {check.name}
            </span>
          </div>
          <RiskBadge level={check.riskLevel} />
        </div>

        <div className="font-mono text-[10px] text-[oklch(0.50_0.08_220)] mb-2">
          {check.category}
        </div>

        <p className="font-mono text-xs text-[oklch(0.72_0.04_200)] leading-relaxed">
          {check.summary}
        </p>
      </div>

      {/* Expandable findings */}
      {check.findings.length > 0 && (
        <div className="border-t border-[oklch(0.20_0.02_230)]">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-[oklch(0.50_0.08_220)] hover:text-[oklch(0.65_0.10_220)] transition-colors"
          >
            <span className="font-mono text-[10px]">
              {check.findings.length} finding
              {check.findings.length !== 1 ? "s" : ""}
            </span>
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {check.findings.map((finding, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: findings list is static per check result
                      key={i}
                      className="flex items-start gap-2 py-1.5 border-b border-[oklch(0.18_0.02_230)] last:border-0"
                    >
                      <FindingStatusDot status={finding.status} />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-[oklch(0.50_0.06_220)] mb-0.5">
                          {finding.label}
                        </div>
                        <div className="font-mono text-xs text-[oklch(0.75_0.04_200)] break-all">
                          {finding.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const QUICK_EXAMPLES = ["owasp.org", "github.com", "nmap.org"];

const OWASP_CHECK_LIST = [
  { name: "Security Headers", category: "A05 - Security Misconfiguration" },
  { name: "SSL/TLS Certificate", category: "A02 - Cryptographic Failures" },
  { name: "Subdomain Exposure", category: "A01 - Broken Access Control" },
  { name: "DNS Security", category: "A05 - Security Misconfiguration" },
  {
    name: "Information Disclosure",
    category: "A01 - Broken Access Control",
  },
];

export function OWASPChecker() {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<OWASPReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (targetDomain?: string) => {
    const d = (targetDomain ?? domain).trim();
    if (!d) {
      toast.error("Enter a domain to scan");
      return;
    }

    setIsScanning(true);
    setError(null);
    setReport(null);
    if (targetDomain) setDomain(targetDomain);

    try {
      const result = await runOWASPChecks(d);
      setReport(result);
      toast.success(`OWASP scan complete — Grade: ${result.grade}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      setError(msg);
      toast.error(`Scan failed: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const passCount =
    report?.checks.filter((c) => c.status === "pass").length ?? 0;
  const failCount =
    report?.checks.filter((c) => c.status === "fail").length ?? 0;
  const warnCount =
    report?.checks.filter((c) => c.status === "warning").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <div
        className="cyber-card rounded-lg p-6"
        style={{ borderColor: "oklch(0.42 0.16 45 / 0.6)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded bg-[oklch(0.15_0.04_45)] border border-[oklch(0.38_0.14_45)] flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[oklch(0.78_0.18_45)]" />
          </div>
          <div>
            <h2
              className="font-mono font-bold text-sm text-[oklch(0.78_0.18_45)] tracking-wider uppercase"
              style={{ textShadow: "0 0 8px oklch(0.78 0.18 45 / 0.5)" }}
            >
              OWASP Top 10 Checker
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Passive security assessment against OWASP Top 10 categories
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            data-ocid="owasp.input"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isScanning && handleScan()}
            placeholder="example.com"
            disabled={isScanning}
            className="font-mono text-sm bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[oklch(0.78_0.18_45)] focus-visible:border-[oklch(0.50_0.16_45)]"
          />
          <Button
            data-ocid="owasp.primary_button"
            onClick={() => handleScan()}
            disabled={isScanning || !domain.trim()}
            className="font-mono text-xs px-5 bg-[oklch(0.20_0.05_45)] border border-[oklch(0.45_0.16_45)] text-[oklch(0.78_0.18_45)] hover:bg-[oklch(0.24_0.06_45)] hover:text-[oklch(0.85_0.20_45)] transition-all shrink-0"
            variant="outline"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Run OWASP Scan
              </>
            )}
          </Button>
        </div>

        {/* Quick examples */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-muted-foreground">
            Quick scan:
          </span>
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => !isScanning && handleScan(ex)}
              disabled={isScanning}
              className="font-mono text-[10px] px-2 py-0.5 rounded border border-[oklch(0.28_0.04_220)] bg-[oklch(0.14_0.01_240)] text-[oklch(0.55_0.06_220)] hover:text-[oklch(0.78_0.18_45)] hover:border-[oklch(0.42_0.14_45)] transition-colors disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            data-ocid="owasp.loading_state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="cyber-card-cyan rounded-lg p-8 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[oklch(0.40_0.14_45)] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-[oklch(0.78_0.18_45)] animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[oklch(0.78_0.18_45)] animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-semibold text-[oklch(0.78_0.18_45)] mb-1">
                Running OWASP Checks…
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Scanning headers, SSL, subdomains, DNS & disclosure
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full max-w-xl mt-2">
              {OWASP_CHECK_LIST.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[oklch(0.14_0.02_240)] border border-[oklch(0.22_0.03_220)]"
                >
                  <Loader2 className="w-3 h-3 text-[oklch(0.72_0.18_195)] animate-spin shrink-0" />
                  <span className="font-mono text-[9px] text-muted-foreground truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !isScanning && (
          <motion.div
            data-ocid="owasp.error_state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-[oklch(0.42_0.18_25)] bg-[oklch(0.13_0.02_25)] p-6 flex items-start gap-3"
          >
            <ShieldX className="w-5 h-5 text-[oklch(0.65_0.22_25)] shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-sm font-semibold text-[oklch(0.70_0.20_25)] mb-1">
                Scan Failed
              </p>
              <p className="font-mono text-xs text-muted-foreground">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {report && !isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Score summary card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="cyber-card rounded-lg p-5"
              style={{ borderColor: "oklch(0.40 0.12 45 / 0.5)" }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <GradeBadge grade={report.grade} score={report.score} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-mono text-sm font-bold text-foreground">
                      Security Report
                    </h3>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-[oklch(0.30_0.04_220)] text-muted-foreground"
                    >
                      {report.domain}
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground mb-3">
                    Scanned{" "}
                    {new Date(report.scannedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>

                  {/* Summary stats */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.72_0.20_145)]" />
                      <span className="font-mono text-xs text-[oklch(0.65_0.15_145)]">
                        {passCount} passed
                      </span>
                    </div>
                    {warnCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.78_0.18_75)]" />
                        <span className="font-mono text-xs text-[oklch(0.70_0.15_75)]">
                          {warnCount} warning{warnCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {failCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-[oklch(0.65_0.22_25)]" />
                        <span className="font-mono text-xs text-[oklch(0.60_0.18_25)]">
                          {failCount} failed
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        5 checks completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Check cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.checks.map((check, i) => (
                <CheckCard
                  key={check.name}
                  check={check}
                  index={i}
                  ocid={`owasp.item.${i + 1}`}
                />
              ))}
            </div>

            {/* OWASP disclaimer */}
            <div className="rounded-lg border border-[oklch(0.22_0.03_220)] bg-[oklch(0.12_0.01_240)] p-4">
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-[oklch(0.55_0.10_220)]">ℹ</span> This is a{" "}
                <span className="text-[oklch(0.65_0.12_220)]">
                  passive, non-intrusive scan
                </span>{" "}
                using publicly available APIs (crt.sh, Google DNS, allorigins).
                Results are informational only and should be verified with
                authorized penetration testing. Based on{" "}
                <a
                  href="https://owasp.org/Top10/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[oklch(0.72_0.14_195)] hover:text-[oklch(0.80_0.16_195)] underline underline-offset-2 transition-colors"
                >
                  OWASP Top 10 2021
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {!report && !isScanning && !error && (
          <motion.div
            data-ocid="owasp.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center"
            style={{ borderColor: "oklch(0.35 0.10 45 / 0.4)" }}
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.14_0.04_45)/10] border border-[oklch(0.38_0.14_45)] flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-[oklch(0.55_0.14_45)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.15_0.03_45)] border border-[oklch(0.42_0.14_45)] flex items-center justify-center">
                <span className="blink text-[oklch(0.78_0.18_45)] text-[8px] font-mono">
                  ●
                </span>
              </div>
            </div>

            <h3 className="font-mono text-base font-semibold text-foreground mb-2">
              OWASP Security Scan Ready
            </h3>
            <p className="font-mono text-sm text-muted-foreground max-w-md mb-6">
              Enter a domain above to run passive security checks based on the
              OWASP Top 10 framework.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
              {[
                {
                  label: "Security Headers",
                  desc: "A05 · CSP, HSTS, X-Frame-Options",
                  color: "text-[oklch(0.72_0.18_195)]",
                  border: "border-[oklch(0.30_0.08_195)]",
                },
                {
                  label: "SSL/TLS Certificate",
                  desc: "A02 · Cert validity & expiry",
                  color: "text-[oklch(0.72_0.20_145)]",
                  border: "border-[oklch(0.30_0.08_145)]",
                },
                {
                  label: "Subdomain Exposure",
                  desc: "A01 · CT log enumeration",
                  color: "text-[oklch(0.78_0.18_75)]",
                  border: "border-[oklch(0.32_0.08_75)]",
                },
                {
                  label: "DNS Security",
                  desc: "A05 · SPF, DMARC, DNSSEC",
                  color: "text-[oklch(0.78_0.18_45)]",
                  border: "border-[oklch(0.35_0.10_45)]",
                },
                {
                  label: "Information Disclosure",
                  desc: "A01 · robots.txt, sitemap.xml",
                  color: "text-[oklch(0.75_0.22_25)]",
                  border: "border-[oklch(0.32_0.08_25)]",
                },
                {
                  label: "Passive Only",
                  desc: "No exploitation · Read-only",
                  color: "text-muted-foreground",
                  border: "border-[oklch(0.26_0.03_220)]",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`px-3 py-2.5 rounded bg-[oklch(0.12_0.01_240)] border ${item.border} text-left`}
                >
                  <div
                    className={`font-mono text-xs font-semibold ${item.color} mb-0.5`}
                  >
                    {item.label}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
