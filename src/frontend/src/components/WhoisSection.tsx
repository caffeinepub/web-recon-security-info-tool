import { Button } from "@/components/ui/button";
import { Calendar, FileText, Server, User } from "lucide-react";
import { useState } from "react";
import type { WhoisData } from "../services/reconApi";

interface WhoisSectionProps {
  whoisData: WhoisData | null;
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded bg-cyber-surface1 border border-border/50">
      {Icon && (
        <Icon className="w-4 h-4 text-cyber-cyan mt-0.5 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </div>
        <div className="font-mono text-sm text-foreground break-all">
          {value || "N/A"}
        </div>
      </div>
    </div>
  );
}

export function WhoisSection({ whoisData }: WhoisSectionProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!whoisData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">WHOIS data unavailable</p>
        <p className="font-mono text-xs mt-1 opacity-60">
          API rate limit may have been reached
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Domain" value={whoisData.domain} icon={FileText} />
        <InfoRow
          label="Registrar"
          value={whoisData.registrar}
          icon={Building2Placeholder}
        />
        <InfoRow label="Registrant" value={whoisData.registrant} icon={User} />
        <InfoRow label="Status" value={whoisData.status} icon={FileText} />
        <InfoRow
          label="Created"
          value={whoisData.creationDate}
          icon={Calendar}
        />
        <InfoRow label="Expires" value={whoisData.expiryDate} icon={Calendar} />
        <InfoRow
          label="Updated"
          value={whoisData.updatedDate}
          icon={Calendar}
        />
        <div className="sm:col-span-2">
          <div className="flex items-start gap-3 px-4 py-3 rounded bg-cyber-surface1 border border-border/50">
            <Server className="w-4 h-4 text-cyber-cyan mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                Name Servers
              </div>
              <div className="space-y-1">
                {whoisData.nameServers.map((ns) => (
                  <div key={ns} className="font-mono text-sm text-foreground">
                    {ns}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {whoisData.rawText && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs font-mono text-muted-foreground hover:text-cyber-green"
          >
            {showRaw ? "▼ Hide raw WHOIS" : "▶ Show raw WHOIS"}
          </Button>
          {showRaw && (
            <pre className="mt-2 p-4 rounded bg-cyber-surface1 border border-border/50 text-xs font-mono text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap">
              {whoisData.rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// Inline placeholder to avoid import issues
function Building2Placeholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-label="Building"
      role="img"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}
