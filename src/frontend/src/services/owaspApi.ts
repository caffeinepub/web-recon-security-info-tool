// OWASP Top 10 passive security checks using public, CORS-friendly APIs

export interface Finding {
  label: string;
  value: string;
  status: "pass" | "fail" | "warning" | "info";
}

export interface OWASPCheckResult {
  category: string; // e.g. "A05 - Security Misconfiguration"
  name: string;
  status: "pass" | "fail" | "warning" | "info" | "loading" | "error";
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  summary: string;
  findings: Finding[];
}

export interface OWASPReport {
  domain: string;
  scannedAt: number;
  grade: string; // A+ / A / B / C / D / F
  score: number; // 0-100
  checks: OWASPCheckResult[];
}

// ─── Check 1: Security Headers (A05) ────────────────────────────────────────

async function checkSecurityHeaders(domain: string): Promise<OWASPCheckResult> {
  const REQUIRED_HEADERS = [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ];

  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://${domain}`)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`allorigins returned ${res.status}`);
    const json = await res.json();

    // allorigins returns headers in json.headers (if available) and status
    const rawHeaders: Record<string, string> =
      (json.headers as Record<string, string>) ?? {};

    const findings: Finding[] = REQUIRED_HEADERS.map((h) => {
      const val = rawHeaders[h] || rawHeaders[h.toLowerCase()];
      return {
        label: h,
        value: val ?? "MISSING",
        status: val ? "pass" : "fail",
      };
    });

    const passed = findings.filter((f) => f.status === "pass").length;
    const failed = findings.filter((f) => f.status === "fail").length;

    let status: OWASPCheckResult["status"] = "pass";
    let riskLevel: OWASPCheckResult["riskLevel"] = "LOW";
    if (failed >= 4) {
      status = "fail";
      riskLevel = "HIGH";
    } else if (failed >= 2) {
      status = "warning";
      riskLevel = "MEDIUM";
    } else if (failed >= 1) {
      status = "warning";
      riskLevel = "LOW";
    }

    // If allorigins returned no headers object, indicate limited data
    if (Object.keys(rawHeaders).length === 0) {
      return {
        category: "A05 - Security Misconfiguration",
        name: "Security Headers",
        status: "warning",
        riskLevel: "MEDIUM",
        summary:
          "Could not retrieve headers via proxy — manual verification recommended",
        findings: REQUIRED_HEADERS.map((h) => ({
          label: h,
          value: "Unable to verify",
          status: "warning" as const,
        })),
      };
    }

    return {
      category: "A05 - Security Misconfiguration",
      name: "Security Headers",
      status,
      riskLevel,
      summary: `${passed}/${REQUIRED_HEADERS.length} security headers present${
        failed > 0
          ? ` — missing: ${findings
              .filter((f) => f.status === "fail")
              .map((f) => f.label)
              .join(", ")}`
          : ""
      }`,
      findings,
    };
  } catch {
    return {
      category: "A05 - Security Misconfiguration",
      name: "Security Headers",
      status: "warning",
      riskLevel: "MEDIUM",
      summary: "Could not fetch headers — check domain availability",
      findings: REQUIRED_HEADERS.map((h) => ({
        label: h,
        value: "Unreachable",
        status: "warning" as const,
      })),
    };
  }
}

// ─── Check 2: SSL/TLS Certificate (A02) ─────────────────────────────────────

async function checkSSLCertificate(domain: string): Promise<OWASPCheckResult> {
  try {
    const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
    const data: Array<{
      id: number;
      not_before: string;
      not_after: string;
      issuer_name: string;
      common_name: string;
    }> = await res.json();

    if (!data || data.length === 0) {
      return {
        category: "A02 - Cryptographic Failures",
        name: "SSL/TLS Certificate",
        status: "fail",
        riskLevel: "CRITICAL",
        summary: "No SSL certificate found for this domain",
        findings: [
          {
            label: "Certificate",
            value: "NOT FOUND",
            status: "fail",
          },
        ],
      };
    }

    // Sort by most recent
    const sorted = [...data].sort(
      (a, b) =>
        new Date(b.not_before || 0).getTime() -
        new Date(a.not_before || 0).getTime(),
    );
    const cert = sorted[0];

    const notAfter = new Date(cert.not_after);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry < 30;

    // Extract issuer CA name
    const issuerMatch = cert.issuer_name?.match(/O=([^,]+)/);
    const issuer = issuerMatch
      ? issuerMatch[1].trim()
      : cert.issuer_name || "Unknown";

    const findings: Finding[] = [
      {
        label: "Common Name",
        value: cert.common_name || domain,
        status: "info",
      },
      {
        label: "Issuer",
        value: issuer,
        status: "info",
      },
      {
        label: "Valid From",
        value: new Date(cert.not_before).toLocaleDateString(),
        status: "info",
      },
      {
        label: "Valid Until",
        value: notAfter.toLocaleDateString(),
        status: isExpired ? "fail" : isExpiringSoon ? "warning" : "pass",
      },
      {
        label: "Days Until Expiry",
        value: isExpired
          ? `EXPIRED (${Math.abs(daysUntilExpiry)} days ago)`
          : `${daysUntilExpiry} days`,
        status: isExpired ? "fail" : isExpiringSoon ? "warning" : "pass",
      },
      {
        label: "Total Certs Found",
        value: data.length.toString(),
        status: "info",
      },
    ];

    let status: OWASPCheckResult["status"] = "pass";
    let riskLevel: OWASPCheckResult["riskLevel"] = "LOW";

    if (isExpired) {
      status = "fail";
      riskLevel = "CRITICAL";
    } else if (isExpiringSoon) {
      status = "warning";
      riskLevel = "HIGH";
    }

    return {
      category: "A02 - Cryptographic Failures",
      name: "SSL/TLS Certificate",
      status,
      riskLevel,
      summary: isExpired
        ? `Certificate EXPIRED ${Math.abs(daysUntilExpiry)} days ago — issued by ${issuer}`
        : isExpiringSoon
          ? `Certificate expires in ${daysUntilExpiry} days — renew soon`
          : `Valid certificate from ${issuer}, expires in ${daysUntilExpiry} days`,
      findings,
    };
  } catch {
    return {
      category: "A02 - Cryptographic Failures",
      name: "SSL/TLS Certificate",
      status: "error",
      riskLevel: "HIGH",
      summary: "Could not retrieve certificate data from crt.sh",
      findings: [
        {
          label: "Error",
          value: "crt.sh unreachable or no data",
          status: "fail",
        },
      ],
    };
  }
}

// ─── Check 3: Subdomain Exposure (A01) ───────────────────────────────────────

async function checkSubdomainExposure(
  domain: string,
): Promise<OWASPCheckResult> {
  try {
    const url = `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
    const data: Array<{ name_value: string }> = await res.json();

    const seen = new Set<string>();
    for (const entry of data) {
      const names = (entry.name_value || "").split("\n");
      for (const name of names) {
        const clean = name.trim().toLowerCase().replace(/^\*\./, "");
        if (clean.endsWith(domain) && clean !== domain) {
          seen.add(clean);
        }
      }
    }

    const subdomains = Array.from(seen).sort().slice(0, 30);
    const count = seen.size;

    let riskLevel: OWASPCheckResult["riskLevel"] = "INFO";
    let status: OWASPCheckResult["status"] = "pass";

    if (count > 20) {
      riskLevel = "MEDIUM";
      status = "warning";
    } else if (count >= 5) {
      riskLevel = "LOW";
      status = "info";
    }

    const findings: Finding[] = subdomains.slice(0, 20).map((sub) => ({
      label: "Subdomain",
      value: sub,
      status: "info" as const,
    }));

    if (count > 20) {
      findings.push({
        label: "Note",
        value: `...and ${count - 20} more subdomains found`,
        status: "warning",
      });
    }

    return {
      category: "A01 - Broken Access Control",
      name: "Subdomain Exposure",
      status,
      riskLevel,
      summary:
        count === 0
          ? "No subdomains found in certificate transparency logs"
          : `${count} subdomain${count !== 1 ? "s" : ""} discovered via CT logs`,
      findings:
        findings.length > 0
          ? findings
          : [{ label: "Result", value: "No subdomains found", status: "pass" }],
    };
  } catch {
    return {
      category: "A01 - Broken Access Control",
      name: "Subdomain Exposure",
      status: "error",
      riskLevel: "LOW",
      summary: "Could not enumerate subdomains",
      findings: [
        {
          label: "Error",
          value: "crt.sh unreachable",
          status: "warning",
        },
      ],
    };
  }
}

// ─── Check 4: DNS Security (A05) ─────────────────────────────────────────────

async function checkDNSSecurity(domain: string): Promise<OWASPCheckResult> {
  try {
    const [aRes, txtRes, dmarcRes, mxRes] = await Promise.allSettled([
      fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
        {
          signal: AbortSignal.timeout(10000),
        },
      ).then((r) => r.json()),
      fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`,
        { signal: AbortSignal.timeout(10000) },
      ).then((r) => r.json()),
      fetch(
        `https://dns.google/resolve?name=_dmarc.${encodeURIComponent(domain)}&type=TXT`,
        { signal: AbortSignal.timeout(10000) },
      ).then((r) => r.json()),
      fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
        { signal: AbortSignal.timeout(10000) },
      ).then((r) => r.json()),
    ]);

    const findings: Finding[] = [];

    // A record check
    if (aRes.status === "fulfilled") {
      const aData = aRes.value as {
        Answer?: Array<{ data: string }>;
        AD?: boolean;
      };
      const aRecords = aData?.Answer ?? [];
      findings.push({
        label: "A Record",
        value:
          aRecords.map((r: { data: string }) => r.data).join(", ") ||
          "Not found",
        status: aRecords.length > 0 ? "pass" : "fail",
      });
      // DNSSEC (AD = Authenticated Data flag)
      findings.push({
        label: "DNSSEC",
        value: aData?.AD
          ? "Enabled (AD flag set)"
          : "Not verified (AD flag not set)",
        status: aData?.AD ? "pass" : "warning",
      });
    }

    // SPF check
    let hasSPF = false;
    if (txtRes.status === "fulfilled") {
      const txtData = txtRes.value as { Answer?: Array<{ data: string }> };
      const txts = (txtData?.Answer ?? []).map((r: { data: string }) =>
        r.data.replace(/"/g, ""),
      );
      const spfRecord = txts.find((t: string) => t.startsWith("v=spf1"));
      hasSPF = !!spfRecord;
      findings.push({
        label: "SPF Record",
        value: spfRecord ?? "MISSING — email spoofing possible",
        status: hasSPF ? "pass" : "fail",
      });
    }

    // DMARC check
    let hasDMARC = false;
    if (dmarcRes.status === "fulfilled") {
      const dmarcData = dmarcRes.value as { Answer?: Array<{ data: string }> };
      const dmarcRecords = (dmarcData?.Answer ?? []).map(
        (r: { data: string }) => r.data.replace(/"/g, ""),
      );
      const dmarcRecord = dmarcRecords.find((t: string) =>
        t.startsWith("v=DMARC1"),
      );
      hasDMARC = !!dmarcRecord;
      findings.push({
        label: "DMARC Record",
        value: dmarcRecord ?? "MISSING — phishing risk",
        status: hasDMARC ? "pass" : "fail",
      });
    }

    // MX check
    if (mxRes.status === "fulfilled") {
      const mxData = mxRes.value as { Answer?: Array<{ data: string }> };
      const mxRecords = (mxData?.Answer ?? []).map(
        (r: { data: string }) => r.data,
      );
      findings.push({
        label: "MX Records",
        value:
          mxRecords.length > 0
            ? mxRecords.slice(0, 3).join(", ")
            : "None found",
        status: mxRecords.length > 0 ? "info" : "info",
      });
    }

    const failCount = findings.filter((f) => f.status === "fail").length;
    let status: OWASPCheckResult["status"] = "pass";
    let riskLevel: OWASPCheckResult["riskLevel"] = "LOW";

    if (failCount >= 2) {
      status = "fail";
      riskLevel = "HIGH";
    } else if (failCount === 1) {
      status = "warning";
      riskLevel = "MEDIUM";
    }

    const issues: string[] = [];
    if (!hasSPF) issues.push("no SPF");
    if (!hasDMARC) issues.push("no DMARC");

    return {
      category: "A05 - Security Misconfiguration",
      name: "DNS Security",
      status,
      riskLevel,
      summary:
        issues.length > 0
          ? `DNS issues detected: ${issues.join(", ")} — email domain impersonation risk`
          : "DNS security records (SPF, DMARC) are configured",
      findings,
    };
  } catch {
    return {
      category: "A05 - Security Misconfiguration",
      name: "DNS Security",
      status: "error",
      riskLevel: "MEDIUM",
      summary: "DNS security check failed",
      findings: [
        { label: "Error", value: "DNS resolution failed", status: "warning" },
      ],
    };
  }
}

// ─── Check 5: Information Disclosure (A01) ───────────────────────────────────

async function checkInformationDisclosure(
  domain: string,
): Promise<OWASPCheckResult> {
  const SENSITIVE_PATHS = [
    "admin",
    "api",
    "backup",
    "config",
    "private",
    "test",
    ".git",
    "secret",
    "internal",
    "staging",
    "dev",
    "database",
    "db",
    "wp-admin",
  ];

  const findings: Finding[] = [];

  try {
    // Fetch robots.txt
    const robotsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://${domain}/robots.txt`)}`;
    const robotsRes = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(10000),
    });
    const robotsJson = await robotsRes.json();
    const robotsContent: string = robotsJson?.contents ?? "";

    if (
      robotsContent &&
      robotsContent.length > 0 &&
      !robotsContent.includes("404")
    ) {
      const lines = robotsContent.split("\n");
      const disallowLines = lines
        .filter((l: string) => l.toLowerCase().startsWith("disallow:"))
        .map((l: string) => l.replace(/disallow:/i, "").trim());

      const sensitivePaths = disallowLines.filter((path: string) =>
        SENSITIVE_PATHS.some((s) => path.toLowerCase().includes(s)),
      );

      if (sensitivePaths.length > 0) {
        findings.push({
          label: "robots.txt — Sensitive Paths",
          value: sensitivePaths.slice(0, 5).join(", "),
          status: "warning",
        });
        findings.push({
          label: "robots.txt Total Disallow Rules",
          value: `${disallowLines.length} paths disallowed`,
          status: "info",
        });
      } else {
        findings.push({
          label: "robots.txt",
          value: `${disallowLines.length} disallow rules — no obviously sensitive paths`,
          status: "pass",
        });
      }
    } else {
      findings.push({
        label: "robots.txt",
        value: "Not found or empty",
        status: "info",
      });
    }
  } catch {
    findings.push({
      label: "robots.txt",
      value: "Could not fetch",
      status: "warning",
    });
  }

  try {
    // Fetch sitemap.xml
    const sitemapUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://${domain}/sitemap.xml`)}`;
    const sitemapRes = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(10000),
    });
    const sitemapJson = await sitemapRes.json();
    const sitemapContent: string = sitemapJson?.contents ?? "";

    if (sitemapContent?.includes("<url>") && !sitemapContent.includes("404")) {
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      findings.push({
        label: "sitemap.xml",
        value: `Found — ${urlCount} URL${urlCount !== 1 ? "s" : ""} exposed`,
        status: urlCount > 100 ? "warning" : "info",
      });
    } else {
      findings.push({
        label: "sitemap.xml",
        value: "Not found or empty",
        status: "info",
      });
    }
  } catch {
    findings.push({
      label: "sitemap.xml",
      value: "Could not fetch",
      status: "warning",
    });
  }

  const hasSensitiveDisclosure = findings.some(
    (f) => f.label.includes("Sensitive") && f.status === "warning",
  );

  return {
    category: "A01 - Broken Access Control",
    name: "Information Disclosure",
    status: hasSensitiveDisclosure ? "warning" : "pass",
    riskLevel: hasSensitiveDisclosure ? "MEDIUM" : "LOW",
    summary: hasSensitiveDisclosure
      ? "Sensitive paths exposed via robots.txt — may hint at hidden endpoints"
      : "No obvious information disclosure via public files",
    findings,
  };
}

// ─── Scoring & Grading ───────────────────────────────────────────────────────

function computeScore(checks: OWASPCheckResult[]): {
  score: number;
  grade: string;
} {
  let score = 100;

  for (const check of checks) {
    if (check.status === "fail") {
      if (check.riskLevel === "CRITICAL") score -= 20;
      else if (check.riskLevel === "HIGH") score -= 20;
      else if (check.riskLevel === "MEDIUM") score -= 10;
      else if (check.riskLevel === "LOW") score -= 5;
    } else if (check.status === "warning") {
      if (check.riskLevel === "HIGH") score -= 10;
      else if (check.riskLevel === "MEDIUM") score -= 8;
      else if (check.riskLevel === "LOW") score -= 3;
    } else if (check.status === "error") {
      score -= 5;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  return { score, grade };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function runOWASPChecks(domain: string): Promise<OWASPReport> {
  // Normalize domain
  const cleanDomain = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  const results = await Promise.allSettled([
    checkSecurityHeaders(cleanDomain),
    checkSSLCertificate(cleanDomain),
    checkSubdomainExposure(cleanDomain),
    checkDNSSecurity(cleanDomain),
    checkInformationDisclosure(cleanDomain),
  ]);

  const checks: OWASPCheckResult[] = results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    // Fallback for unexpected errors
    const fallbackNames = [
      "Security Headers",
      "SSL/TLS Certificate",
      "Subdomain Exposure",
      "DNS Security",
      "Information Disclosure",
    ];
    return {
      category: "Unknown",
      name: fallbackNames[i] ?? "Unknown Check",
      status: "error" as const,
      riskLevel: "MEDIUM" as const,
      summary: "Check failed unexpectedly",
      findings: [
        {
          label: "Error",
          value: String(
            (result as PromiseRejectedResult).reason ?? "Unknown error",
          ),
          status: "fail" as const,
        },
      ],
    };
  });

  const { score, grade } = computeScore(checks);

  return {
    domain: cleanDomain,
    scannedAt: Date.now(),
    grade,
    score,
    checks,
  };
}
