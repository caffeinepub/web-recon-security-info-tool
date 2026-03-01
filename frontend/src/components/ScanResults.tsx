import { Globe, Server, FileText, Database, Lock, Code2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubdomainsSection } from './SubdomainsSection';
import { HostingSection } from './HostingSection';
import { WhoisSection } from './WhoisSection';
import { DnsRecordsSection } from './DnsRecordsSection';
import { SslCertificateSection } from './SslCertificateSection';
import { HttpHeadersSection } from './HttpHeadersSection';
import type { ReconData } from '../services/reconApi';

interface ScanResultsProps {
  domain: string;
  data: ReconData;
}

export function ScanResults({ domain, data }: ScanResultsProps) {
  const hasErrors = Object.keys(data.errors).length > 0;

  return (
    <div className="cyber-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-cyber-surface1/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Target</span>
              <span className="text-xs font-mono text-cyber-green-dim">://</span>
            </div>
            <h2 className="font-mono text-lg font-bold text-cyber-green neon-text-green">{domain}</h2>
          </div>
          {hasErrors && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-warning">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Some data unavailable (API limits)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs defaultValue="subdomains">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full bg-cyber-surface1 border border-border/50 h-auto p-1 gap-1">
            {[
              { value: 'subdomains', icon: Globe, label: 'Subdomains', count: data.subdomains.length },
              { value: 'hosting', icon: Server, label: 'Hosting', count: null },
              { value: 'whois', icon: FileText, label: 'WHOIS', count: null },
              { value: 'dns', icon: Database, label: 'DNS', count: data.dnsRecords.length },
              { value: 'ssl', icon: Lock, label: 'SSL', count: null },
              { value: 'headers', icon: Code2, label: 'Headers', count: data.httpHeaders.length },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-mono data-[state=active]:bg-cyber-green/10 data-[state=active]:text-cyber-green data-[state=active]:border-cyber-green-dim data-[state=active]:border rounded transition-all"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="text-[10px] text-cyber-green-dim">{tab.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="subdomains" className="mt-0">
              <SubdomainsSection subdomains={data.subdomains} />
            </TabsContent>
            <TabsContent value="hosting" className="mt-0">
              <HostingSection hostingInfo={data.hostingInfo} />
            </TabsContent>
            <TabsContent value="whois" className="mt-0">
              <WhoisSection whoisData={data.whoisData} />
            </TabsContent>
            <TabsContent value="dns" className="mt-0">
              <DnsRecordsSection dnsRecords={data.dnsRecords} />
            </TabsContent>
            <TabsContent value="ssl" className="mt-0">
              <SslCertificateSection sslCertInfo={data.sslCertInfo} />
            </TabsContent>
            <TabsContent value="headers" className="mt-0">
              <HttpHeadersSection httpHeaders={data.httpHeaders} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
