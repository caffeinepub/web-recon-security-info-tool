// CVE Intelligence API service - calls NVD (National Vulnerability Database) directly

export interface CvssMetric {
  baseScore: number;
  baseSeverity: string;
}

export interface CveReference {
  url: string;
  tags?: string[];
  source?: string;
}

export interface CveItem {
  id: string;
  published: string;
  lastModified: string;
  descriptions: { lang: string; value: string }[];
  metrics: {
    cvssMetricV31?: { cvssData: CvssMetric }[];
    cvssMetricV30?: { cvssData: CvssMetric }[];
    cvssMetricV2?: { cvssData: { baseScore: number } }[];
  };
  references: CveReference[];
  weaknesses?: { description: { lang: string; value: string }[] }[];
}

export interface NvdResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: { cve: CveItem }[];
}

export interface CveSearchResult {
  total: number;
  items: CveItem[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  exploitCount: number;
}

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export function getCvssScore(cve: CveItem): {
  score: number;
  severity: SeverityLevel;
} {
  const v31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const v30 = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
  const v2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;

  if (v31) {
    return {
      score: v31.baseScore,
      severity: v31.baseSeverity.toUpperCase() as SeverityLevel,
    };
  }
  if (v30) {
    return {
      score: v30.baseScore,
      severity: v30.baseSeverity.toUpperCase() as SeverityLevel,
    };
  }
  if (v2) {
    const score = v2.baseScore;
    let severity: SeverityLevel = "NONE";
    if (score >= 9.0) severity = "CRITICAL";
    else if (score >= 7.0) severity = "HIGH";
    else if (score >= 4.0) severity = "MEDIUM";
    else severity = "LOW";
    return { score, severity };
  }
  return { score: 0, severity: "NONE" };
}

export function hasExploit(cve: CveItem): boolean {
  return cve.references.some((ref) => {
    const tags = ref.tags?.map((t) => t.toLowerCase()) || [];
    return (
      tags.includes("exploit") ||
      tags.includes("exploit code") ||
      ref.url.includes("exploit-db.com") ||
      ref.url.includes("exploitdb.com") ||
      ref.url.includes("packetstorm") ||
      (ref.url.includes("github.com") && tags.includes("exploit"))
    );
  });
}

export function hasPatch(cve: CveItem): boolean {
  return cve.references.some((ref) => {
    const tags = ref.tags?.map((t) => t.toLowerCase()) || [];
    return (
      tags.includes("patch") ||
      tags.includes("vendor advisory") ||
      tags.includes("fix")
    );
  });
}

export function getDescription(cve: CveItem): string {
  const enDesc = cve.descriptions.find((d) => d.lang === "en");
  return enDesc?.value || "No description available.";
}

export function getPublishedDate(cve: CveItem): string {
  try {
    return new Date(cve.published).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return cve.published;
  }
}

export function getKeyReferences(cve: CveItem): CveReference[] {
  const prioritized = [...cve.references].sort((a, b) => {
    const aTags = a.tags?.map((t) => t.toLowerCase()) || [];
    const bTags = b.tags?.map((t) => t.toLowerCase()) || [];
    const score = (tags: string[]) => {
      if (tags.includes("exploit")) return 3;
      if (tags.includes("patch") || tags.includes("vendor advisory")) return 2;
      if (tags.includes("issue tracking")) return 1;
      return 0;
    };
    return score(bTags) - score(aTags);
  });
  return prioritized.slice(0, 5);
}

export async function searchCves(
  software: string,
  version: string,
): Promise<CveSearchResult> {
  const keyword = version
    ? `${software.trim()} ${version.trim()}`
    : software.trim();

  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=20`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `NVD API returned ${response.status}: ${response.statusText}`,
    );
  }

  const data: NvdResponse = await response.json();
  const items = data.vulnerabilities.map((v) => v.cve);

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let exploitCount = 0;

  for (const item of items) {
    const { severity } = getCvssScore(item);
    if (severity === "CRITICAL") criticalCount++;
    else if (severity === "HIGH") highCount++;
    else if (severity === "MEDIUM") mediumCount++;
    else lowCount++;

    if (hasExploit(item)) exploitCount++;
  }

  return {
    total: data.totalResults,
    items,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    exploitCount,
  };
}
