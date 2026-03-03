// Reconnaissance API service - all calls made from frontend to public APIs

export interface SubdomainResult {
  subdomain: string;
  ip?: string;
}

export interface HostingInfo {
  ip: string;
  hostname: string;
  city: string;
  region: string;
  country: string;
  org: string;
  asn: string;
  timezone: string;
  latitude?: string;
  longitude?: string;
}

export interface WhoisData {
  domain: string;
  registrar: string;
  creationDate: string;
  expiryDate: string;
  updatedDate: string;
  nameServers: string[];
  status: string;
  registrant: string;
  rawText: string;
}

export interface DnsRecord {
  type: string;
  value: string;
}

export interface SslCertInfo {
  commonName: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  sans: string[];
  serialNumber: string;
  rawText: string;
}

export interface HttpHeaderInfo {
  key: string;
  value: string;
}

export interface ReconData {
  subdomains: SubdomainResult[];
  hostingInfo: HostingInfo | null;
  whoisData: WhoisData | null;
  dnsRecords: DnsRecord[];
  sslCertInfo: SslCertInfo | null;
  httpHeaders: HttpHeaderInfo[];
  errors: Record<string, string>;
}

// Use a CORS proxy for HackerTarget (they have CORS restrictions on some endpoints)
const CORS_PROXY = "https://corsproxy.io/?url=";
const HT_BASE = "https://api.hackertarget.com";

function withProxy(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

// Fetch subdomains via crt.sh (Certificate Transparency logs) - has CORS support
export async function fetchSubdomains(
  domain: string,
): Promise<SubdomainResult[]> {
  try {
    const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
    const data = await res.json();
    const seen = new Set<string>();
    const results: SubdomainResult[] = [];
    for (const entry of data) {
      const names: string[] = (entry.name_value || "").split("\n");
      for (const name of names) {
        const clean = name.trim().toLowerCase().replace(/^\*\./, "");
        if (clean?.endsWith(domain) && !seen.has(clean)) {
          seen.add(clean);
          results.push({ subdomain: clean });
        }
      }
    }
    return results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
  } catch {
    // Fallback: try HackerTarget hostsearch
    try {
      const url = `${HT_BASE}/hostsearch/?q=${encodeURIComponent(domain)}`;
      const res = await fetch(withProxy(url), {
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      if (text.includes("error") || text.includes("API count exceeded")) {
        return [];
      }
      const seen = new Set<string>();
      const results: SubdomainResult[] = [];
      for (const line of text.split("\n")) {
        const parts = line.split(",");
        if (parts.length >= 2) {
          const sub = parts[0].trim();
          const ip = parts[1].trim();
          if (sub && !seen.has(sub)) {
            seen.add(sub);
            results.push({ subdomain: sub, ip });
          }
        }
      }
      return results;
    } catch {
      return [];
    }
  }
}

// Fetch hosting/IP info via ipapi.co (free, CORS-enabled)
export async function fetchHostingInfo(
  domain: string,
): Promise<HostingInfo | null> {
  try {
    // First resolve domain to IP via HackerTarget DNS
    let ip = domain;
    try {
      const dnsUrl = `${HT_BASE}/dnslookup/?q=${encodeURIComponent(domain)}`;
      const dnsRes = await fetch(withProxy(dnsUrl), {
        signal: AbortSignal.timeout(10000),
      });
      const dnsText = await dnsRes.text();
      const aMatch = dnsText.match(/^A\s*:\s*([\d.]+)/m);
      if (aMatch) ip = aMatch[1];
    } catch {
      // use domain directly
    }

    const geoUrl = `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(10000) });
    if (!geoRes.ok) throw new Error(`ipapi.co returned ${geoRes.status}`);
    const geo = await geoRes.json();

    if (geo.error) throw new Error(geo.reason || "ipapi.co error");

    return {
      ip: geo.ip || ip,
      hostname: geo.hostname || domain,
      city: geo.city || "Unknown",
      region: geo.region || "Unknown",
      country: geo.country_name || "Unknown",
      org: geo.org || "Unknown",
      asn: geo.asn || "Unknown",
      timezone: geo.timezone || "Unknown",
      latitude: geo.latitude?.toString(),
      longitude: geo.longitude?.toString(),
    };
  } catch {
    return null;
  }
}

// Fetch WHOIS data via HackerTarget
export async function fetchWhoisData(
  domain: string,
): Promise<WhoisData | null> {
  try {
    const url = `${HT_BASE}/whois/?q=${encodeURIComponent(domain)}`;
    const res = await fetch(withProxy(url), {
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();

    if (text.includes("API count exceeded") || text.includes("error")) {
      throw new Error("API limit reached");
    }

    const extract = (patterns: RegExp[]): string => {
      for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[1].trim();
      }
      return "N/A";
    };

    const extractAll = (pattern: RegExp): string[] => {
      const matches: string[] = [];
      const re = new RegExp(pattern.source, "gim");
      let m: RegExpExecArray | null = re.exec(text);
      while (m !== null) {
        matches.push(m[1].trim());
        m = re.exec(text);
      }
      return matches;
    };

    const registrar = extract([/Registrar:\s*(.+)/i, /registrar:\s*(.+)/i]);
    const creationDate = extract([
      /Creation Date:\s*(.+)/i,
      /Created:\s*(.+)/i,
      /created:\s*(.+)/i,
    ]);
    const expiryDate = extract([
      /Registry Expiry Date:\s*(.+)/i,
      /Expiry Date:\s*(.+)/i,
      /Expiration Date:\s*(.+)/i,
      /expires:\s*(.+)/i,
    ]);
    const updatedDate = extract([
      /Updated Date:\s*(.+)/i,
      /Last Modified:\s*(.+)/i,
      /last-update:\s*(.+)/i,
    ]);
    const nameServers = extractAll(/Name Server:\s*(.+)/i);
    const status = extract([/Domain Status:\s*(.+)/i, /Status:\s*(.+)/i]);
    const registrant = extract([
      /Registrant Organization:\s*(.+)/i,
      /Registrant Name:\s*(.+)/i,
      /org:\s*(.+)/i,
    ]);

    return {
      domain,
      registrar,
      creationDate,
      expiryDate,
      updatedDate,
      nameServers: nameServers.length > 0 ? nameServers : ["N/A"],
      status,
      registrant,
      rawText: text,
    };
  } catch {
    return null;
  }
}

// Fetch DNS records via HackerTarget
export async function fetchDnsRecords(domain: string): Promise<DnsRecord[]> {
  try {
    const url = `${HT_BASE}/dnslookup/?q=${encodeURIComponent(domain)}`;
    const res = await fetch(withProxy(url), {
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();

    if (text.includes("API count exceeded") || text.includes("error")) {
      return [];
    }

    const records: DnsRecord[] = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^([A-Z]+)\s*:\s*(.+)$/);
      if (match) {
        records.push({ type: match[1], value: match[2].trim() });
      }
    }
    return records;
  } catch {
    return [];
  }
}

// Fetch SSL certificate info via crt.sh
export async function fetchSslCertInfo(
  domain: string,
): Promise<SslCertInfo | null> {
  try {
    const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) return null;

    // Get the most recent valid cert
    const sorted = [...data].sort(
      (a, b) =>
        new Date(b.not_before || 0).getTime() -
        new Date(a.not_before || 0).getTime(),
    );
    const cert = sorted[0];

    const sans = new Set<string>();
    for (const entry of data.slice(0, 20)) {
      const names: string[] = (entry.name_value || "").split("\n");
      for (const n of names) {
        const clean = n.trim();
        if (clean) sans.add(clean);
      }
    }

    return {
      commonName: cert.common_name || domain,
      issuer: cert.issuer_name || "Unknown",
      notBefore: cert.not_before || "Unknown",
      notAfter: cert.not_after || "Unknown",
      sans: Array.from(sans).slice(0, 20),
      serialNumber: cert.id?.toString() || "Unknown",
      rawText: JSON.stringify(cert, null, 2),
    };
  } catch {
    return null;
  }
}

// Fetch HTTP headers via HackerTarget
export async function fetchHttpHeaders(
  domain: string,
): Promise<HttpHeaderInfo[]> {
  try {
    const url = `${HT_BASE}/httpheaders/?q=${encodeURIComponent(domain)}`;
    const res = await fetch(withProxy(url), {
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();

    if (text.includes("API count exceeded") || text.includes("error")) {
      return [];
    }

    const headers: HttpHeaderInfo[] = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("HTTP/")) {
        headers.push({ key: "Status", value: trimmed });
        continue;
      }
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const key = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();
        if (key && value) {
          headers.push({ key, value });
        }
      }
    }
    return headers;
  } catch {
    return [];
  }
}

// Run full recon scan
export async function runFullScan(domain: string): Promise<ReconData> {
  const errors: Record<string, string> = {};

  const [
    subdomains,
    hostingInfo,
    whoisData,
    dnsRecords,
    sslCertInfo,
    httpHeaders,
  ] = await Promise.allSettled([
    fetchSubdomains(domain),
    fetchHostingInfo(domain),
    fetchWhoisData(domain),
    fetchDnsRecords(domain),
    fetchSslCertInfo(domain),
    fetchHttpHeaders(domain),
  ]);

  const getResult = <T>(
    result: PromiseSettledResult<T>,
    key: string,
    fallback: T,
  ): T => {
    if (result.status === "fulfilled") return result.value;
    errors[key] = result.reason?.message || "Unknown error";
    return fallback;
  };

  return {
    subdomains: getResult(subdomains, "subdomains", []),
    hostingInfo: getResult(hostingInfo, "hosting", null),
    whoisData: getResult(whoisData, "whois", null),
    dnsRecords: getResult(dnsRecords, "dns", []),
    sslCertInfo: getResult(sslCertInfo, "ssl", null),
    httpHeaders: getResult(httpHeaders, "headers", []),
    errors,
  };
}

// Serialize ReconData to strings for backend storage
export function serializeReconData(data: ReconData) {
  return {
    subdomains: data.subdomains.map((s) =>
      s.ip ? `${s.subdomain} (${s.ip})` : s.subdomain,
    ),
    hostingInfo: data.hostingInfo ? JSON.stringify(data.hostingInfo) : "",
    whoisData: data.whoisData ? JSON.stringify(data.whoisData) : "",
    dnsRecords: JSON.stringify(data.dnsRecords),
    sslCertDetails: data.sslCertInfo ? JSON.stringify(data.sslCertInfo) : "",
    httpHeaders: JSON.stringify(data.httpHeaders),
  };
}

// Deserialize stored backend data back to ReconData
export function deserializeReconData(scan: {
  subdomains: string[];
  hostingInfo: string;
  whoisData: string;
  dnsRecords: string;
  sslCertDetails: string;
  httpHeaders: string;
}): ReconData {
  const parseJson = <T>(str: string, fallback: T): T => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    subdomains: scan.subdomains.map((s) => {
      const match = s.match(/^(.+?)\s*\((.+)\)$/);
      return match ? { subdomain: match[1], ip: match[2] } : { subdomain: s };
    }),
    hostingInfo: parseJson<HostingInfo | null>(scan.hostingInfo, null),
    whoisData: parseJson<WhoisData | null>(scan.whoisData, null),
    dnsRecords: parseJson<DnsRecord[]>(scan.dnsRecords, []),
    sslCertInfo: parseJson<SslCertInfo | null>(scan.sslCertDetails, null),
    httpHeaders: parseJson<HttpHeaderInfo[]>(scan.httpHeaders, []),
    errors: {},
  };
}
