import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  FileSearch,
  Heart,
  KeyRound,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Terminal,
  Waves,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { BruteForceAnalyzer } from "./components/BruteForceAnalyzer";
import { CVEDashboard } from "./components/CVEDashboard";
import { DDoSAnalyzer } from "./components/DDoSAnalyzer";
import { DomainScanForm } from "./components/DomainScanForm";
import { IntelFetchDashboard } from "./components/IntelFetchDashboard";
import { OWASPChecker } from "./components/OWASPChecker";
import { ScanHistory } from "./components/ScanHistory";
import { ScanResults } from "./components/ScanResults";
import { WhoisLookupDashboard } from "./components/WhoisLookupDashboard";
import type { ReconData } from "./services/reconApi";

export default function App() {
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ReconData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("cve");

  const handleScanComplete = (domain: string, data: ReconData) => {
    setCurrentDomain(domain);
    setCurrentData(data);
  };

  const handleSelectHistory = (domain: string, data: ReconData) => {
    setCurrentDomain(domain);
    setCurrentData(data);
  };

  const appId = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "web-recon-tool",
  );

  return (
    <div className="min-h-screen bg-cyber-surface0 grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-cyber-surface1/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="w-8 h-8 rounded bg-[oklch(0.15_0.03_195)] border border-[oklch(0.35_0.10_195)] flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-[oklch(0.72_0.18_195)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono font-bold text-[oklch(0.72_0.18_195)] text-sm tracking-wider uppercase"
                  style={{ textShadow: "0 0 8px oklch(0.72 0.18 195 / 0.5)" }}
                >
                  CVE Intelligence
                </span>
                <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[oklch(0.14_0.02_195)] border border-[oklch(0.32_0.08_195)]">
                  <Zap className="w-2.5 h-2.5 text-[oklch(0.72_0.18_195)]" />
                  <span className="font-mono text-[10px] text-[oklch(0.65_0.12_195)]">
                    NVD
                  </span>
                </span>
              </div>
              <p className="hidden sm:block font-mono text-[10px] text-muted-foreground tracking-wider">
                Vulnerability Research &amp; Security Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyber-surface2 border border-border/50">
              <Terminal className="w-3.5 h-3.5 text-cyber-green" />
              <span className="font-mono text-xs text-muted-foreground">
                <span className="text-cyber-green">●</span> Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[oklch(0.13_0.012_240)] border border-[oklch(0.28_0.04_220)] h-auto p-1 gap-1 mb-6 w-full sm:w-auto">
            <TabsTrigger
              data-ocid="nav.cve.tab"
              value="cve"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.02_195)] data-[state=active]:text-[oklch(0.72_0.18_195)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <Database className="w-3.5 h-3.5" />
              CVE Lookup
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.recon.tab"
              value="recon"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.02_145)] data-[state=active]:text-cyber-green data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <Search className="w-3.5 h-3.5" />
              Domain Recon
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.intel.tab"
              value="intel"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.02_290)] data-[state=active]:text-[oklch(0.76_0.18_290)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <Radio className="w-3.5 h-3.5" />
              Intel Fetch
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.whois.tab"
              value="whois"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.02_60)] data-[state=active]:text-[oklch(0.78_0.18_60)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <FileSearch className="w-3.5 h-3.5" />
              WHOIS
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.owasp.tab"
              value="owasp"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.03_45)] data-[state=active]:text-[oklch(0.78_0.18_45)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              OWASP
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.ddos.tab"
              value="ddos"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.03_145)] data-[state=active]:text-[oklch(0.78_0.22_145)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <Waves className="w-3.5 h-3.5" />
              DDoS Analysis
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.bruteforce.tab"
              value="bruteforce"
              className="font-mono text-xs px-4 py-2 rounded data-[state=active]:bg-[oklch(0.18_0.03_25)] data-[state=active]:text-[oklch(0.75_0.22_25)] data-[state=active]:shadow-none flex items-center gap-2 text-[oklch(0.55_0.06_220)]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Brute Force
            </TabsTrigger>
          </TabsList>

          {/* CVE Intelligence Tab */}
          <TabsContent value="cve" className="mt-0">
            <CVEDashboard />
          </TabsContent>

          {/* Intel Fetch Tab */}
          <TabsContent value="intel" className="mt-0">
            <IntelFetchDashboard />
          </TabsContent>

          {/* WHOIS Lookup Tab */}
          <TabsContent value="whois" className="mt-0">
            <WhoisLookupDashboard />
          </TabsContent>

          {/* OWASP Checker Tab */}
          <TabsContent value="owasp" className="mt-0">
            <OWASPChecker />
          </TabsContent>

          {/* DDoS Analysis Tab */}
          <TabsContent value="ddos" className="mt-0">
            <DDoSAnalyzer />
          </TabsContent>

          {/* Brute Force Tab */}
          <TabsContent value="bruteforce" className="mt-0">
            <BruteForceAnalyzer />
          </TabsContent>

          {/* Domain Recon Tab */}
          <TabsContent value="recon" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left column: form + results */}
              <div className="lg:col-span-3 space-y-6">
                <DomainScanForm
                  onScanComplete={handleScanComplete}
                  isScanning={isScanning}
                  setIsScanning={setIsScanning}
                />

                {currentDomain && currentData ? (
                  <ScanResults domain={currentDomain} data={currentData} />
                ) : (
                  <div className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full bg-cyber-green/5 border border-cyber-green-dim flex items-center justify-center">
                        <Shield className="w-10 h-10 text-cyber-green-dim" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-green/20 border border-cyber-green-dim flex items-center justify-center">
                        <span className="blink text-cyber-green text-[8px] font-mono">
                          ●
                        </span>
                      </div>
                    </div>
                    <h3 className="font-mono text-lg font-semibold text-foreground mb-2">
                      Ready for Reconnaissance
                    </h3>
                    <p className="font-mono text-sm text-muted-foreground max-w-md">
                      Enter a target domain above to begin scanning. The tool
                      will enumerate subdomains, gather hosting info, WHOIS
                      data, DNS records, SSL certificates, and HTTP headers.
                    </p>
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                      {[
                        { label: "Subdomains", desc: "CT log enumeration" },
                        { label: "Hosting & IP", desc: "Geolocation & ASN" },
                        { label: "WHOIS", desc: "Registration data" },
                        { label: "DNS Records", desc: "A, MX, NS, TXT" },
                        { label: "SSL Cert", desc: "Certificate details" },
                        { label: "HTTP Headers", desc: "Security analysis" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="px-3 py-2.5 rounded bg-cyber-surface1 border border-border/50 text-left"
                        >
                          <div className="font-mono text-xs font-semibold text-cyber-green">
                            {item.label}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: history */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 h-[calc(100vh-6rem)]">
                  <ScanHistory
                    activeDomain={currentDomain}
                    onSelectScan={handleSelectHistory}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-cyber-surface1/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} CVE Intelligence — Vulnerability
            Research Dashboard
          </div>
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3 h-3 text-[oklch(0.72_0.18_195)] fill-[oklch(0.72_0.18_195)] mx-0.5" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[oklch(0.72_0.18_195)] hover:text-[oklch(0.80_0.20_195)] transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      <Toaster theme="dark" />
    </div>
  );
}
