import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, Globe } from "lucide-react";
import { useState } from "react";
import type { SubdomainResult } from "../services/reconApi";

interface SubdomainsSectionProps {
  subdomains: SubdomainResult[];
}

export function SubdomainsSection({ subdomains }: SubdomainsSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = subdomains
      .map((s) => (s.ip ? `${s.subdomain} → ${s.ip}` : s.subdomain))
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (subdomains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Globe className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">No subdomains discovered</p>
        <p className="font-mono text-xs mt-1 opacity-60">
          CT logs may not have data for this domain
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-cyber-green/10 text-cyber-green border-cyber-green-dim font-mono text-xs">
            {subdomains.length} found
          </Badge>
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-cyber-green transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy all"}
        </button>
      </div>
      <ScrollArea className="h-72">
        <div className="space-y-1 pr-3">
          {subdomains.map((s) => (
            <div
              key={s.subdomain}
              className="flex items-center justify-between px-3 py-2 rounded bg-cyber-surface1 border border-border/50 hover:border-cyber-green-dim transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-cyber-green-dim font-mono text-xs select-none">
                  ›
                </span>
                <span className="font-mono text-sm text-foreground truncate">
                  {s.subdomain}
                </span>
              </div>
              {s.ip && (
                <span className="font-mono text-xs text-cyber-cyan ml-3 flex-shrink-0">
                  {s.ip}
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
