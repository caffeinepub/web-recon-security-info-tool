import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Network,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AttackVector = "volumetric" | "protocol" | "application";
type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

interface AttackPreset {
  name: string;
  vector: AttackVector;
  protocol: string;
  packetDesc: string;
  rateThreshold: string;
  severity: SeverityLevel;
  payloadType: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ATTACK_PRESETS: AttackPreset[] = [
  {
    name: "HTTP Flood",
    vector: "application",
    protocol: "HTTP/1.1 & HTTP/2",
    packetDesc:
      "Crafted HTTP GET/POST requests with randomized headers and paths to exhaust web server resources",
    rateThreshold: "50,000–500,000 req/s per botnet node",
    severity: "High",
    payloadType: "http",
  },
  {
    name: "UDP Flood",
    vector: "volumetric",
    protocol: "UDP",
    packetDesc:
      "High-volume UDP datagrams with randomized payload sent to random ports overwhelming network bandwidth",
    rateThreshold: "100 Gbps–1 Tbps aggregate bandwidth",
    severity: "Critical",
    payloadType: "udp",
  },
  {
    name: "SYN Flood",
    vector: "protocol",
    protocol: "TCP",
    packetDesc:
      "Half-open TCP connections consuming server state tables; SYN cookies bypass possible",
    rateThreshold: "1M–10M SYN packets/s",
    severity: "High",
    payloadType: "syn",
  },
  {
    name: "DNS Amplification",
    vector: "volumetric",
    protocol: "DNS over UDP",
    packetDesc:
      "Small DNS ANY queries spoofed to victim IP; open resolvers return 28–54x amplified responses",
    rateThreshold: "Amplification factor ×28–×54 per query",
    severity: "Critical",
    payloadType: "dns",
  },
  {
    name: "Slowloris",
    vector: "application",
    protocol: "HTTP/1.x",
    packetDesc:
      "Keeps HTTP connections open by sending partial headers slowly, exhausting connection pool",
    rateThreshold: "65,000 concurrent sockets per attacker IP",
    severity: "Medium",
    payloadType: "http",
  },
  {
    name: "ICMP Flood",
    vector: "volumetric",
    protocol: "ICMP",
    packetDesc:
      "Massive ICMP Echo Request (ping) storms saturating inbound and outbound bandwidth",
    rateThreshold: "1M+ ICMP packets/s",
    severity: "Medium",
    payloadType: "udp",
  },
];

const PAYLOAD_FORMATS: Record<string, { label: string; code: string }[]> = {
  http: [
    {
      label: "HTTP Flood Request",
      code: `GET /search?q=${encodeURIComponent("RAND_STRING_8765")} HTTP/1.1\r
Host: target.example.com\r
User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)\r
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r
Accept-Language: en-US,en;q=0.5\r
Accept-Encoding: gzip, deflate\r
Connection: keep-alive\r
Cache-Control: no-cache\r
Pragma: no-cache\r
X-Forwarded-For: 192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}\r
\r
[FLOOD: Repeat ×50,000 req/s per node from botnet]`,
    },
    {
      label: "POST Body Flood",
      code: `POST /api/login HTTP/1.1\r
Host: target.example.com\r
Content-Type: application/x-www-form-urlencoded\r
Content-Length: 4096\r
Connection: keep-alive\r
\r
username=RAND_USER_9823&password=RAND_PASS_1029&[4KB_PADDING_JUNK_DATA...]
[Layer 7 exhausts backend app pool — bypasses volumetric filters]`,
    },
  ],
  udp: [
    {
      label: "UDP Flood Hex Dump",
      code: `Ethernet Frame:
  Dst MAC:  ff:ff:ff:ff:ff:ff  (broadcast)
  Src MAC:  SPOOFED
  EtherType: 0x0800 (IPv4)

IPv4 Header (20 bytes):
  Version: 4   IHL: 5   TOS: 0x00
  Total Len: 1500   ID: 0x0000
  TTL: 64   Protocol: 17 (UDP)
  Src IP: SPOOFED_RANDOM
  Dst IP: TARGET_IP

UDP Header (8 bytes):
  Src Port: RAND(1024–65535)
  Dst Port: RAND(1–65535)
  Length:   1492
  Checksum: 0x0000 (disabled)

Payload (1484 bytes):
  00 00 00 00 00 00 00 00  [RANDOM_JUNK × 1484]

[Rate: 1M packets/s → ~12 Gbps per source]`,
    },
    {
      label: "ICMP Echo Flood",
      code: `ICMP Type 8 (Echo Request):
  Type: 0x08   Code: 0x00
  Checksum: COMPUTED
  Identifier: RAND
  Seq Number: INCREMENT

Payload: AAAA...AAAA (1472 bytes padding)

Spoofed Src IP: RANDOM_FORGED
Dst IP: TARGET_IP

[Smurf variant: Sent to broadcast → amplified by network hosts]
[Fraggle variant: UDP port 7/19 echo/chargen amplification]`,
    },
  ],
  syn: [
    {
      label: "SYN Flood TCP Flags",
      code: `TCP Header Analysis:
┌─────────────────────────────────────────────┐
│ Field         │ Value    │ Purpose           │
├───────────────┼──────────┼───────────────────┤
│ SYN Flag      │ 1        │ Initiates handshake│
│ ACK Flag      │ 0        │ No acknowledgment │
│ FIN Flag      │ 0        │ Not closing       │
│ RST Flag      │ 0        │ Not resetting     │
│ Window Size   │ 65535    │ Max buffer claim  │
│ Src Port      │ RANDOM   │ Forged source     │
│ Dst Port      │ 80/443   │ Target service    │
│ Src IP        │ SPOOFED  │ Randomized /8     │
│ Seq Number    │ RANDOM   │ Unpredictable     │
└─────────────────────────────────────────────┘

State Machine Attack:
  Server allocs: ~280 bytes per half-open connection
  Default timeout: 75s → fills backlog queue
  Backlog queue: 512–4096 slots → exhausted in <1s

Countermeasure bypass:
  SYN Cookies: bypass by rotating IPs faster than validation`,
    },
  ],
  dns: [
    {
      label: "DNS Amplification Query",
      code: `DNS Request (from spoofed victim IP):
  Transaction ID: 0x1337
  Flags: Standard Query (recursion desired)
  Questions: 1

  Query: ANY . (root zone)  ← maximizes response size

UDP Packet to Open Resolver:
  Src IP: VICTIM_IP (spoofed)
  Dst IP: OPEN_RESOLVER (e.g., 8.8.8.8)
  Src Port: 53
  Dst Port: 53
  Size: 28 bytes

DNS Response (sent to VICTIM):
  Answers: 50+ records
  Additional: authority, NS, SOA records
  Size: ~3,000–4,500 bytes

Amplification Factor: ×107 (28B → 3000B)

Attack vector:
  10,000 resolvers × 28B query = 280 KB/s out
  10,000 resolvers × 3000B reply = 30 MB/s → VICTIM`,
    },
  ],
};

const NETWORK_HOPS = [
  {
    hop: 1,
    host: "Attacker Edge Router",
    ip: "10.0.0.1",
    latency: "0ms",
    spof: false,
  },
  {
    hop: 2,
    host: "ISP Transit AS1234",
    ip: "203.0.113.1",
    latency: "8ms",
    spof: false,
  },
  {
    hop: 3,
    host: "Peering Exchange (IXP)",
    ip: "198.51.100.1",
    latency: "22ms",
    spof: true,
  },
  {
    hop: 4,
    host: "Upstream Provider BGP",
    ip: "192.0.2.1",
    latency: "35ms",
    spof: false,
  },
  {
    hop: 5,
    host: "CDN/Scrubbing Center",
    ip: "104.21.0.1",
    latency: "42ms",
    spof: false,
  },
  {
    hop: 6,
    host: "Load Balancer",
    ip: "10.1.0.254",
    latency: "44ms",
    spof: true,
  },
  {
    hop: 7,
    host: "Web Server Cluster",
    ip: "TARGET_IP",
    latency: "46ms",
    spof: false,
  },
];

const MITIGATION_CONTROLS = [
  {
    label: "BGP Anycast routing distributes traffic across global PoPs",
    done: true,
  },
  {
    label: "CDN absorbs volumetric floods at edge (Cloudflare / Akamai)",
    done: true,
  },
  {
    label: "Rate limiting at edge: max 1,000 req/s per IP per minute",
    done: true,
  },
  { label: "IP reputation filtering blocks known botnet ranges", done: false },
  { label: "SYN cookies enabled on all load-balancing nodes", done: true },
  { label: "CAPTCHA challenge on anomalous traffic patterns", done: false },
  { label: "Auto-scale backend capacity during traffic spikes", done: false },
  {
    label: "Null routing (RTBH) to black-hole highest-volume sources",
    done: true,
  },
  {
    label: "Upstream scrubbing center (> 1 Tbps mitigation capacity)",
    done: false,
  },
  {
    label: "Real-time alerting: threshold >10K req/s triggers PagerDuty",
    done: true,
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SeverityBadge({ level }: { level: SeverityLevel }) {
  const styles: Record<SeverityLevel, string> = {
    Low: "bg-[oklch(0.15_0.03_145)] border-[oklch(0.40_0.14_145)] text-[oklch(0.72_0.18_155)]",
    Medium:
      "bg-[oklch(0.16_0.04_75)] border-[oklch(0.45_0.16_75)] text-[oklch(0.82_0.18_85)]",
    High: "bg-[oklch(0.16_0.04_55)] border-[oklch(0.45_0.18_55)] text-[oklch(0.78_0.20_55)]",
    Critical:
      "bg-[oklch(0.15_0.04_25)] border-[oklch(0.45_0.20_25)] text-[oklch(0.75_0.22_25)]",
  };
  return (
    <span
      className={`font-mono text-[10px] px-2 py-0.5 rounded border ${styles[level]}`}
    >
      {level}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DDoSAnalyzer() {
  const [target, setTarget] = useState("");
  const [vector, setVector] = useState<AttackVector>("volumetric");
  const [activePreset, setActivePreset] = useState<AttackPreset | null>(null);
  const [payloadTab, setPayloadTab] = useState("http");
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = (preset?: AttackPreset) => {
    const p =
      preset ??
      ATTACK_PRESETS.find((a) => a.vector === vector) ??
      ATTACK_PRESETS[0];
    setActivePreset(p);
    setPayloadTab(p.payloadType);
    setAnalyzed(true);
  };

  const handlePresetClick = (preset: AttackPreset) => {
    setActivePreset(preset);
    setVector(preset.vector);
    setPayloadTab(preset.payloadType);
    setAnalyzed(true);
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="rounded-lg border border-[oklch(0.50_0.18_75)] bg-[oklch(0.14_0.04_75)] px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[oklch(0.82_0.18_85)] shrink-0 mt-0.5" />
        <p className="font-mono text-xs text-[oklch(0.85_0.14_85)] leading-relaxed">
          <span className="font-bold text-[oklch(0.88_0.18_85)]">
            Authorized use only.
          </span>{" "}
          For authorized security testing only. Unauthorized use against systems
          you do not own is illegal.
        </p>
      </div>

      {/* Input Panel */}
      <div
        className="cyber-card rounded-lg p-6"
        style={{ borderColor: "oklch(0.42 0.18 145 / 0.6)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded bg-[oklch(0.15_0.04_145)] border border-[oklch(0.38_0.14_145)] flex items-center justify-center">
            <Waves className="w-3.5 h-3.5 text-[oklch(0.78_0.22_145)]" />
          </div>
          <div>
            <h2
              className="font-mono font-bold text-sm text-[oklch(0.78_0.22_145)] tracking-wider uppercase"
              style={{ textShadow: "0 0 8px oklch(0.78 0.22 145 / 0.5)" }}
            >
              DDoS Attack Format Analyzer
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Educational bridge analysis for authorized DDoS resilience testing
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            data-ocid="ddos.target.input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="target.example.com or 192.168.1.1"
            className="font-mono text-sm bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[oklch(0.78_0.22_145)] focus-visible:border-[oklch(0.50_0.18_145)]"
          />
          <Select
            value={vector}
            onValueChange={(v) => setVector(v as AttackVector)}
          >
            <SelectTrigger
              data-ocid="ddos.vector.select"
              className="w-full sm:w-52 font-mono text-xs bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground focus:ring-[oklch(0.78_0.22_145)]"
            >
              <SelectValue placeholder="Attack vector" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs bg-[oklch(0.12_0.01_240)] border-[oklch(0.28_0.04_220)]">
              <SelectItem value="volumetric">Volumetric</SelectItem>
              <SelectItem value="protocol">Protocol</SelectItem>
              <SelectItem value="application">Application Layer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            data-ocid="ddos.analyze.button"
            onClick={() => handleAnalyze()}
            className="font-mono text-xs px-5 bg-[oklch(0.20_0.05_145)] border border-[oklch(0.45_0.16_145)] text-[oklch(0.78_0.22_145)] hover:bg-[oklch(0.24_0.06_145)] hover:text-[oklch(0.88_0.24_145)] transition-all shrink-0"
            variant="outline"
          >
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Analyze
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-muted-foreground">
            Attack presets:
          </span>
          {ATTACK_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              type="button"
              data-ocid={`ddos.preset.button.${i + 1}`}
              onClick={() => handlePresetClick(preset)}
              className="font-mono text-[10px] px-2 py-0.5 rounded border border-[oklch(0.28_0.04_220)] bg-[oklch(0.14_0.01_240)] text-[oklch(0.55_0.06_220)] hover:text-[oklch(0.78_0.22_145)] hover:border-[oklch(0.42_0.14_145)] transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {analyzed && activePreset && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Attack Profile Card */}
            <motion.div
              data-ocid="ddos.profile.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-lg border border-[oklch(0.40_0.14_145)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 16px oklch(0.78 0.22 145 / 0.08)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[oklch(0.78_0.22_145)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.78_0.22_145)]">
                  Attack Profile
                </h3>
                <div className="ml-auto">
                  <SeverityBadge level={activePreset.severity} />
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Attack Name
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {activePreset.name}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Vector Category
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] capitalize ${
                      activePreset.vector === "volumetric"
                        ? "border-[oklch(0.40_0.20_25)] text-[oklch(0.75_0.22_25)]"
                        : activePreset.vector === "protocol"
                          ? "border-[oklch(0.40_0.14_195)] text-[oklch(0.72_0.18_195)]"
                          : "border-[oklch(0.40_0.14_145)] text-[oklch(0.72_0.18_145)]"
                    }`}
                  >
                    {activePreset.vector}
                  </Badge>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Protocol
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.72_0.18_195)]">
                    {activePreset.protocol}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Rate Threshold
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.78_0.18_75)]">
                    {activePreset.rateThreshold}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Packet Structure
                  </span>
                  <p className="font-mono text-xs text-[oklch(0.75_0.04_200)] leading-relaxed">
                    {activePreset.packetDesc}
                  </p>
                </div>
                {target && (
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Target
                    </span>
                    <span className="font-mono text-xs text-[oklch(0.72_0.18_145)] break-all">
                      {target}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payload Format Inspector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-[oklch(0.35_0.10_145)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.78 0.22 145 / 0.06)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <Network className="w-4 h-4 text-[oklch(0.72_0.18_195)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.72_0.18_195)]">
                  Payload Format Inspector
                </h3>
              </div>
              <div className="p-4">
                <Tabs value={payloadTab} onValueChange={setPayloadTab}>
                  <TabsList className="bg-[oklch(0.12_0.01_240)] border border-[oklch(0.24_0.03_220)] h-auto p-0.5 gap-0.5 mb-4 flex-wrap">
                    {(["http", "udp", "syn", "dns"] as const).map((tab) => (
                      <TabsTrigger
                        key={tab}
                        data-ocid="ddos.payload.tab"
                        value={tab}
                        className="font-mono text-[10px] px-3 py-1.5 rounded data-[state=active]:bg-[oklch(0.18_0.02_195)] data-[state=active]:text-[oklch(0.72_0.18_195)] data-[state=active]:shadow-none text-[oklch(0.50_0.06_220)] uppercase tracking-wider"
                      >
                        {tab === "http"
                          ? "HTTP Flood"
                          : tab === "udp"
                            ? "UDP/ICMP"
                            : tab === "syn"
                              ? "SYN Flood"
                              : "DNS Amp"}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(["http", "udp", "syn", "dns"] as const).map((tab) => (
                    <TabsContent
                      key={tab}
                      value={tab}
                      data-ocid="ddos.payload.panel"
                      className="mt-0 space-y-3"
                    >
                      {(PAYLOAD_FORMATS[tab] ?? []).map((fmt) => (
                        <div key={fmt.label} className="space-y-2">
                          <div className="font-mono text-[10px] text-[oklch(0.55_0.10_195)] uppercase tracking-wider">
                            {fmt.label}
                          </div>
                          <pre className="terminal-bg rounded p-4 font-mono text-[10px] text-[oklch(0.78_0.10_145)] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                            {fmt.code}
                          </pre>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </motion.div>

            {/* Bridge Analysis Card */}
            <motion.div
              data-ocid="ddos.bridge.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-lg border border-[oklch(0.38_0.14_195)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.72 0.18 195 / 0.07)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <Network className="w-4 h-4 text-[oklch(0.72_0.18_195)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.72_0.18_195)]">
                  Bridge / Network Path Resilience Analysis
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {/* Topology */}
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                    Simulated Network Topology
                  </div>
                  <div className="space-y-1.5">
                    {NETWORK_HOPS.map((hop, i) => (
                      <div
                        key={hop.hop}
                        className={`flex items-center gap-3 px-3 py-2 rounded border ${
                          hop.spof
                            ? "border-[oklch(0.42_0.18_25)] bg-[oklch(0.13_0.02_25)]"
                            : "border-[oklch(0.22_0.03_220)] bg-[oklch(0.12_0.01_240)]"
                        }`}
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-8 shrink-0">
                          {String(hop.hop).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs ${hop.spof ? "text-[oklch(0.78_0.20_35)]" : "text-foreground"}`}
                            >
                              {hop.host}
                            </span>
                            {hop.spof && (
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[oklch(0.15_0.04_25)] border border-[oklch(0.42_0.18_25)] text-[oklch(0.75_0.22_25)]">
                                SPOF
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {hop.ip}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-[oklch(0.55_0.10_195)] shrink-0">
                          {hop.latency}
                        </span>
                        {i < NETWORK_HOPS.length - 1 && (
                          <span className="font-mono text-[10px] text-muted-foreground/30">
                            →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-[oklch(0.65_0.20_25)] mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />2 Single Points of
                    Failure (SPOF) identified
                  </p>
                </div>

                {/* Mitigation recs */}
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                    Mitigation Recommendations
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        label: "Deploy BGP Anycast",
                        desc: "Distribute traffic to multiple global PoPs",
                      },
                      {
                        label: "CDN/Scrubbing Center",
                        desc: "Filter malicious traffic upstream",
                      },
                      {
                        label: "Rate Limiting Rules",
                        desc: "Per-IP and per-subnet throttles",
                      },
                      {
                        label: "SPOF Elimination",
                        desc: "Add redundant load balancers + IXP paths",
                      },
                    ].map((rec) => (
                      <div
                        key={rec.label}
                        className="px-3 py-2.5 rounded border border-[oklch(0.28_0.06_195)] bg-[oklch(0.12_0.01_240)]"
                      >
                        <div className="font-mono text-xs font-semibold text-[oklch(0.72_0.18_195)] mb-0.5">
                          {rec.label}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {rec.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mitigation Checklist */}
            <motion.div
              data-ocid="ddos.mitigation.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-[oklch(0.35_0.10_145)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.78 0.22 145 / 0.06)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.20_145)]" />
                  <h3 className="font-mono text-sm font-bold text-[oklch(0.72_0.20_145)]">
                    DDoS Mitigation Checklist
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {MITIGATION_CONTROLS.filter((c) => c.done).length}/
                  {MITIGATION_CONTROLS.length} controls active
                </span>
              </div>
              <div className="p-5 space-y-2">
                {MITIGATION_CONTROLS.map((ctrl) => (
                  <div
                    key={ctrl.label}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded border ${
                      ctrl.done
                        ? "border-[oklch(0.30_0.08_145)] bg-[oklch(0.12_0.01_145)]"
                        : "border-[oklch(0.22_0.03_220)] bg-[oklch(0.11_0.01_240)]"
                    }`}
                  >
                    {ctrl.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.72_0.20_145)] shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[oklch(0.35_0.06_220)] shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`font-mono text-xs leading-relaxed ${ctrl.done ? "text-[oklch(0.72_0.06_200)]" : "text-muted-foreground"}`}
                    >
                      {ctrl.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!analyzed && (
          <motion.div
            data-ocid="ddos.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center"
            style={{ borderColor: "oklch(0.35 0.10 145 / 0.4)" }}
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.13_0.03_145)] border border-[oklch(0.38_0.14_145)] flex items-center justify-center">
                <Waves className="w-10 h-10 text-[oklch(0.55_0.14_145)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.15_0.03_145)] border border-[oklch(0.42_0.14_145)] flex items-center justify-center">
                <span className="blink text-[oklch(0.78_0.22_145)] text-[8px] font-mono">
                  ●
                </span>
              </div>
            </div>
            <h3 className="font-mono text-base font-semibold text-foreground mb-2">
              DDoS Analysis Ready
            </h3>
            <p className="font-mono text-sm text-muted-foreground max-w-md">
              Enter a target and select an attack vector, or click a quick
              preset to inspect DDoS attack formats, bridge topology, and
              mitigation controls.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
