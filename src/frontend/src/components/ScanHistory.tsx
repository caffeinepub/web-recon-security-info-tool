import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  Clock,
  History,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { ScanResult } from "../backend";
import { useActor } from "../hooks/useActor";
import { useGetScanHistory } from "../hooks/useQueries";
import { type ReconData, deserializeReconData } from "../services/reconApi";

interface ScanHistoryProps {
  activeDomain: string | null;
  onSelectScan: (domain: string, data: ReconData) => void;
}

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / BigInt(1_000_000));
    const date = new Date(ms);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

export function ScanHistory({ activeDomain, onSelectScan }: ScanHistoryProps) {
  const { data: history, isLoading, refetch, isFetching } = useGetScanHistory();
  const { actor } = useActor();

  const handleSelect = async (domain: string) => {
    if (!actor) return;
    try {
      const scan: ScanResult = await actor.getScan(domain);
      const reconData = deserializeReconData({
        subdomains: scan.subdomains,
        hostingInfo: scan.hostingInfo,
        whoisData: scan.whoisData,
        dnsRecords: scan.dnsRecords,
        sslCertDetails: scan.sslCertDetails,
        httpHeaders: scan.httpHeaders,
      });
      onSelectScan(domain, reconData);
    } catch {
      // ignore
    }
  };

  return (
    <div className="cyber-card-cyan rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 bg-cyber-surface1/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyber-cyan" />
          <span className="text-xs font-mono text-cyber-cyan uppercase tracking-widest font-semibold">
            Scan History
          </span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-cyber-cyan transition-colors"
          title="Refresh history"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-cyber-cyan animate-spin" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="font-mono text-xs text-center">No scans yet</p>
              <p className="font-mono text-xs opacity-60 text-center mt-1">
                Run a scan to see history
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {[...history]
                .sort((a, b) => Number(b[1] - a[1]))
                .map(([domain, timestamp]) => (
                  <button
                    type="button"
                    key={domain}
                    onClick={() => handleSelect(domain)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded text-left transition-all group ${
                      activeDomain === domain
                        ? "bg-cyber-cyan/10 border border-cyber-cyan-dim"
                        : "hover:bg-cyber-surface2 border border-transparent hover:border-border/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-mono text-xs font-medium truncate ${
                          activeDomain === domain
                            ? "text-cyber-cyan"
                            : "text-foreground"
                        }`}
                      >
                        {domain}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(timestamp)}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                        activeDomain === domain
                          ? "text-cyber-cyan"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
