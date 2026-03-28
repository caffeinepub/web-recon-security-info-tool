// Intel Fetch API service - passive OSINT / threat intelligence APIs

export interface IpApiResult {
  status: "success" | "fail";
  message?: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  asname: string;
  reverse: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  query: string;
}

export interface ShodanInternetDBResult {
  ip: string;
  ports: number[];
  tags: string[];
  cpes: string[];
  hostnames: string[];
  vulns: string[];
}

export interface OtxPulse {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created: string;
  author_name: string;
  targeted_countries: string[];
  adversary: string;
}

export interface OtxResult {
  indicator: string;
  reputation: number;
  pulse_info: {
    count: number;
    pulses: OtxPulse[];
  };
  type: string;
}

export type IntelSourceStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "no-data";

export interface IntelSource<T> {
  status: IntelSourceStatus;
  data: T | null;
  error: string | null;
}

export interface IntelResult {
  target: string;
  resolvedIp: string | null;
  isIp: boolean;
  ipApi: IntelSource<IpApiResult>;
  shodan: IntelSource<ShodanInternetDBResult>;
  otx: IntelSource<OtxResult>;
  fetchedAt: number;
}

/** Detect if a string looks like an IPv4 or IPv6 address */
export function isIpAddress(str: string): boolean {
  // IPv4
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 (basic check)
  const ipv6 = /^[0-9a-fA-F:]+:[0-9a-fA-F:]+$/;
  return ipv4.test(str.trim()) || ipv6.test(str.trim());
}

/** Resolve a domain to its A record IP using DNS-over-HTTPS */
async function resolveToIp(domain: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const aRecord = data?.Answer?.find(
      (r: { type: number; data: string }) => r.type === 1,
    );
    return aRecord?.data ?? null;
  } catch {
    return null;
  }
}

/** Fetch IP geolocation and ASN data from ip-api.com */
export async function fetchIpIntel(target: string): Promise<IpApiResult> {
  const cleanTarget = target.trim();
  let ip = cleanTarget;

  if (!isIpAddress(cleanTarget)) {
    const resolved = await resolveToIp(cleanTarget);
    if (resolved) ip = resolved;
  }

  // ip-api.com free tier requires HTTP (no HTTPS on free plan)
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`ip-api.com returned HTTP ${res.status}`);

  const data: IpApiResult = await res.json();
  if (data.status === "fail") {
    throw new Error(data.message || "ip-api.com query failed");
  }
  return data;
}

/** Fetch open ports, CPEs, hostnames and CVEs from Shodan InternetDB */
export async function fetchShodanIntel(
  ip: string,
): Promise<ShodanInternetDBResult> {
  const url = `https://internetdb.shodan.io/${encodeURIComponent(ip.trim())}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (res.status === 404) {
    // Return empty record – not an error, just no Shodan data
    return {
      ip: ip.trim(),
      ports: [],
      tags: [],
      cpes: [],
      hostnames: [],
      vulns: [],
    };
  }

  if (!res.ok) throw new Error(`Shodan InternetDB returned HTTP ${res.status}`);

  const data = await res.json();
  return {
    ip: data.ip ?? ip.trim(),
    ports: data.ports ?? [],
    tags: data.tags ?? [],
    cpes: data.cpes ?? [],
    hostnames: data.hostnames ?? [],
    vulns: data.vulns ?? [],
  };
}

/** Fetch threat pulse data from AlienVault OTX */
export async function fetchOtxIntel(
  target: string,
  isIp: boolean,
): Promise<OtxResult> {
  const indicator = isIp ? "IPv4" : "domain";
  const url = `https://otx.alienvault.com/api/v1/indicators/${indicator}/${encodeURIComponent(target.trim())}/general`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`OTX returned HTTP ${res.status}`);

  const data = await res.json();
  return {
    indicator: data.indicator ?? target.trim(),
    reputation: data.reputation ?? 0,
    type: data.type ?? indicator,
    pulse_info: {
      count: data.pulse_info?.count ?? 0,
      pulses: (data.pulse_info?.pulses ?? []).slice(0, 10).map(
        (p: {
          id?: string;
          name?: string;
          description?: string;
          tags?: string[];
          created?: string;
          author_name?: string;
          targeted_countries?: string[];
          adversary?: string;
        }) => ({
          id: p.id ?? "",
          name: p.name ?? "Unnamed pulse",
          description: p.description ?? "",
          tags: p.tags ?? [],
          created: p.created ?? "",
          author_name: p.author_name ?? "Unknown",
          targeted_countries: p.targeted_countries ?? [],
          adversary: p.adversary ?? "",
        }),
      ),
    },
  };
}

/** Run all three intel sources in parallel for a given target */
export async function runIntelFetch(target: string): Promise<IntelResult> {
  const cleanTarget = target.trim();
  const targetIsIp = isIpAddress(cleanTarget);

  // Resolve IP ahead of time if it's a domain
  let resolvedIp: string | null = null;
  if (!targetIsIp) {
    resolvedIp = await resolveToIp(cleanTarget);
  } else {
    resolvedIp = cleanTarget;
  }

  const ipForShodan = resolvedIp ?? cleanTarget;

  const [ipApiResult, shodanResult, otxResult] = await Promise.allSettled([
    fetchIpIntel(cleanTarget),
    fetchShodanIntel(ipForShodan),
    fetchOtxIntel(cleanTarget, targetIsIp),
  ]);

  const toSource = <T>(result: PromiseSettledResult<T>): IntelSource<T> => {
    if (result.status === "fulfilled") {
      return { status: "success", data: result.value, error: null };
    }
    return {
      status: "error",
      data: null,
      error: result.reason?.message ?? "Unknown error",
    };
  };

  return {
    target: cleanTarget,
    resolvedIp,
    isIp: targetIsIp,
    ipApi: toSource(ipApiResult),
    shodan: toSource(shodanResult),
    otx: toSource(otxResult),
    fetchedAt: Date.now(),
  };
}
