import { Lock, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SslCertInfo } from '../services/reconApi';

interface SslCertificateSectionProps {
  sslCertInfo: SslCertInfo | null;
}

function InfoRow({ label, value, icon: Icon, highlight }: {
  label: string;
  value: string;
  icon?: React.ElementType;
  highlight?: 'green' | 'red' | 'yellow';
}) {
  const valueClass = highlight === 'green'
    ? 'text-cyber-green'
    : highlight === 'red'
    ? 'text-cyber-danger'
    : highlight === 'yellow'
    ? 'text-cyber-warning'
    : 'text-foreground';

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded bg-cyber-surface1 border border-border/50">
      {Icon && <Icon className="w-4 h-4 text-cyber-cyan mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`font-mono text-sm break-all ${valueClass}`}>{value || 'N/A'}</div>
      </div>
    </div>
  );
}

export function SslCertificateSection({ sslCertInfo }: SslCertificateSectionProps) {
  if (!sslCertInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Lock className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">SSL certificate data unavailable</p>
      </div>
    );
  }

  const isExpired = sslCertInfo.notAfter !== 'Unknown' && new Date(sslCertInfo.notAfter) < new Date();
  const isExpiringSoon = !isExpired && sslCertInfo.notAfter !== 'Unknown' &&
    new Date(sslCertInfo.notAfter) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-4">
      {isExpired && (
        <div className="flex items-center gap-2 px-4 py-3 rounded bg-cyber-danger/10 border border-cyber-danger/30">
          <AlertTriangle className="w-4 h-4 text-cyber-danger flex-shrink-0" />
          <span className="font-mono text-sm text-cyber-danger">Certificate has expired!</span>
        </div>
      )}
      {isExpiringSoon && (
        <div className="flex items-center gap-2 px-4 py-3 rounded bg-cyber-warning/10 border border-cyber-warning/30">
          <AlertTriangle className="w-4 h-4 text-cyber-warning flex-shrink-0" />
          <span className="font-mono text-sm text-cyber-warning">Certificate expires within 30 days</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Common Name" value={sslCertInfo.commonName} icon={Shield} />
        <InfoRow label="Issuer" value={sslCertInfo.issuer} icon={Lock} />
        <InfoRow
          label="Valid From"
          value={sslCertInfo.notBefore}
          icon={Calendar}
          highlight="green"
        />
        <InfoRow
          label="Valid Until"
          value={sslCertInfo.notAfter}
          icon={Calendar}
          highlight={isExpired ? 'red' : isExpiringSoon ? 'yellow' : 'green'}
        />
        <div className="sm:col-span-2">
          <InfoRow label="Certificate ID" value={sslCertInfo.serialNumber} icon={Shield} />
        </div>
      </div>

      {sslCertInfo.sans.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Subject Alternative Names
            </span>
            <Badge className="bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan-dim font-mono text-xs">
              {sslCertInfo.sans.length}
            </Badge>
          </div>
          <ScrollArea className="h-36">
            <div className="space-y-1 pr-3">
              {sslCertInfo.sans.map((san, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-surface1 border border-border/30">
                  <span className="text-cyber-cyan-dim font-mono text-xs">›</span>
                  <span className="font-mono text-xs text-foreground">{san}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
