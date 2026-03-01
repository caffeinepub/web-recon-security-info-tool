import { useState } from 'react';
import { Shield, Terminal, Zap, Heart } from 'lucide-react';
import { DomainScanForm } from './components/DomainScanForm';
import { ScanResults } from './components/ScanResults';
import { ScanHistory } from './components/ScanHistory';
import type { ReconData } from './services/reconApi';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ReconData | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanComplete = (domain: string, data: ReconData) => {
    setCurrentDomain(domain);
    setCurrentData(data);
  };

  const handleSelectHistory = (domain: string, data: ReconData) => {
    setCurrentDomain(domain);
    setCurrentData(data);
  };

  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'web-recon-tool'
  );

  return (
    <div className="min-h-screen bg-cyber-surface0 grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-cyber-surface1/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/assets/generated/securecon-logo.dim_256x256.png"
                alt="SecureRecon Logo"
                className="w-8 h-8 rounded"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyber-green hidden" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-cyber-green text-sm tracking-wider uppercase neon-text-green">
                  SecureRecon
                </span>
                <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-green/10 border border-cyber-green-dim">
                  <Zap className="w-2.5 h-2.5 text-cyber-green" />
                  <span className="font-mono text-[10px] text-cyber-green">v1.0</span>
                </span>
              </div>
              <p className="hidden sm:block font-mono text-[10px] text-muted-foreground tracking-wider">
                Web Application Security Reconnaissance
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left column: form + results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Scan form */}
            <DomainScanForm
              onScanComplete={handleScanComplete}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
            />

            {/* Results */}
            {currentDomain && currentData ? (
              <ScanResults domain={currentDomain} data={currentData} />
            ) : (
              <div className="cyber-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-cyber-green/5 border border-cyber-green-dim flex items-center justify-center">
                    <Shield className="w-10 h-10 text-cyber-green-dim" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-green/20 border border-cyber-green-dim flex items-center justify-center">
                    <span className="blink text-cyber-green text-[8px] font-mono">●</span>
                  </div>
                </div>
                <h3 className="font-mono text-lg font-semibold text-foreground mb-2">
                  Ready for Reconnaissance
                </h3>
                <p className="font-mono text-sm text-muted-foreground max-w-md">
                  Enter a target domain above to begin scanning. The tool will enumerate subdomains,
                  gather hosting info, WHOIS data, DNS records, SSL certificates, and HTTP headers.
                </p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                  {[
                    { label: 'Subdomains', desc: 'CT log enumeration' },
                    { label: 'Hosting & IP', desc: 'Geolocation & ASN' },
                    { label: 'WHOIS', desc: 'Registration data' },
                    { label: 'DNS Records', desc: 'A, MX, NS, TXT' },
                    { label: 'SSL Cert', desc: 'Certificate details' },
                    { label: 'HTTP Headers', desc: 'Security analysis' },
                  ].map(item => (
                    <div key={item.label} className="px-3 py-2.5 rounded bg-cyber-surface1 border border-border/50 text-left">
                      <div className="font-mono text-xs font-semibold text-cyber-green">{item.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-cyber-surface1/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} SecureRecon — Web Application Security Tool
          </div>
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
            Built with{' '}
            <Heart className="w-3 h-3 text-cyber-green fill-cyber-green mx-0.5" />
            {' '}using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-green hover:text-cyber-green/80 transition-colors"
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
