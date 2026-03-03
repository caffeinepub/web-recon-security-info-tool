import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Search, Shield } from "lucide-react";
import { useState } from "react";
import { useSaveScan } from "../hooks/useQueries";
import {
  type ReconData,
  runFullScan,
  serializeReconData,
} from "../services/reconApi";

interface DomainScanFormProps {
  onScanComplete: (domain: string, data: ReconData) => void;
  isScanning: boolean;
  setIsScanning: (v: boolean) => void;
}

export function DomainScanForm({
  onScanComplete,
  isScanning,
  setIsScanning,
}: DomainScanFormProps) {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const saveScan = useSaveScan();

  const validateDomain = (d: string): boolean => {
    const pattern =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return pattern.test(d.trim());
  };

  const handleScan = async () => {
    const trimmed = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!trimmed) {
      setError("Please enter a domain name");
      return;
    }
    if (!validateDomain(trimmed)) {
      setError("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setError("");
    setIsScanning(true);
    setScanStatus("Initializing scan...");

    try {
      setScanStatus("Enumerating subdomains via CT logs...");
      const data = await runFullScan(trimmed);

      setScanStatus("Saving results to blockchain...");
      const serialized = serializeReconData(data);
      await saveScan.mutateAsync({
        domain: trimmed,
        ...serialized,
      });

      setScanStatus("Scan complete!");
      onScanComplete(trimmed, data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Scan failed. Please try again.",
      );
    } finally {
      setIsScanning(false);
      setScanStatus("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isScanning) handleScan();
  };

  return (
    <div className="cyber-card rounded-lg p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded bg-cyber-surface2 border border-cyber-green-dim">
          <Shield className="w-5 h-5 text-cyber-green" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-cyber-green font-mono uppercase tracking-widest">
            Target Acquisition
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Enter domain for reconnaissance scan
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-green-dim font-mono text-sm select-none">
            $&gt;
          </span>
          <Input
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="example.com"
            disabled={isScanning}
            className="pl-10 font-mono bg-cyber-surface1 border-cyber-green-dim text-cyber-green placeholder:text-muted-foreground/40 focus:border-cyber-green focus:ring-cyber-green/20 h-11"
          />
        </div>
        <Button
          onClick={handleScan}
          disabled={isScanning || !domain.trim()}
          className="h-11 px-6 bg-cyber-green text-cyber-surface0 hover:bg-cyber-green/90 font-mono font-semibold uppercase tracking-wider border-0 shadow-neon-green disabled:opacity-40"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Scan
            </>
          )}
        </Button>
      </div>

      {isScanning && scanStatus && (
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyber-cyan">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan scan-pulse" />
          <span>{scanStatus}</span>
          <span className="blink">_</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyber-danger">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground font-mono">
          <span className="text-cyber-green-dim">{"//"} </span>
          Scans: subdomains · hosting · WHOIS · DNS · SSL · HTTP headers
        </p>
      </div>
    </div>
  );
}
