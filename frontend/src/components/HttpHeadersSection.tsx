import { Code2, Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { HttpHeaderInfo } from '../services/reconApi';

interface HttpHeadersSectionProps {
  httpHeaders: HttpHeaderInfo[];
}

// Security-relevant headers
const SECURITY_HEADERS = new Set([
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy',
  'x-permitted-cross-domain-policies',
]);

const SENSITIVE_HEADERS = new Set([
  'server',
  'x-powered-by',
  'x-aspnet-version',
  'x-aspnetmvc-version',
]);

export function HttpHeadersSection({ httpHeaders }: HttpHeadersSectionProps) {
  if (httpHeaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Code2 className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">No HTTP headers found</p>
      </div>
    );
  }

  const presentSecurityHeaders = httpHeaders.filter(h =>
    SECURITY_HEADERS.has(h.key.toLowerCase())
  );
  const missingSecurityHeaders = Array.from(SECURITY_HEADERS).filter(sh =>
    !httpHeaders.some(h => h.key.toLowerCase() === sh)
  );

  return (
    <div className="space-y-4">
      {/* Security summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="px-4 py-3 rounded bg-cyber-green/5 border border-cyber-green-dim/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-cyber-green" />
            <span className="text-xs font-mono text-cyber-green uppercase tracking-wider">Present</span>
          </div>
          <span className="font-mono text-2xl font-bold text-cyber-green">{presentSecurityHeaders.length}</span>
          <span className="font-mono text-xs text-muted-foreground ml-1">security headers</span>
        </div>
        <div className="px-4 py-3 rounded bg-cyber-danger/5 border border-cyber-danger/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-cyber-danger" />
            <span className="text-xs font-mono text-cyber-danger uppercase tracking-wider">Missing</span>
          </div>
          <span className="font-mono text-2xl font-bold text-cyber-danger">{missingSecurityHeaders.length}</span>
          <span className="font-mono text-xs text-muted-foreground ml-1">security headers</span>
        </div>
      </div>

      {/* All headers */}
      <ScrollArea className="h-64">
        <div className="space-y-1 pr-3">
          {httpHeaders.map((header, i) => {
            const keyLower = header.key.toLowerCase();
            const isSecurity = SECURITY_HEADERS.has(keyLower);
            const isSensitive = SENSITIVE_HEADERS.has(keyLower);
            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-3 py-2 rounded border transition-colors ${
                  isSecurity
                    ? 'bg-cyber-green/5 border-cyber-green-dim/40'
                    : isSensitive
                    ? 'bg-cyber-danger/5 border-cyber-danger/30'
                    : 'bg-cyber-surface1 border-border/30'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-xs font-semibold ${
                      isSecurity ? 'text-cyber-green' : isSensitive ? 'text-cyber-danger' : 'text-cyber-cyan'
                    }`}>
                      {header.key}
                    </span>
                    {isSecurity && (
                      <Badge className="bg-cyber-green/10 text-cyber-green border-cyber-green-dim font-mono text-[10px] py-0 h-4">
                        security
                      </Badge>
                    )}
                    {isSensitive && (
                      <Badge className="bg-cyber-danger/10 text-cyber-danger border-cyber-danger/30 font-mono text-[10px] py-0 h-4">
                        sensitive
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground break-all mt-0.5 block">
                    {header.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Missing security headers */}
      {missingSecurityHeaders.length > 0 && (
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
            Missing Security Headers
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSecurityHeaders.map(h => (
              <Badge key={h} className="bg-cyber-danger/10 text-cyber-danger border-cyber-danger/30 font-mono text-xs">
                {h}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
