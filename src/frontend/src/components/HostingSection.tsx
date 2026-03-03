import { Building2, MapPin, Server, Wifi } from "lucide-react";
import type { HostingInfo } from "../services/reconApi";

interface HostingSectionProps {
  hostingInfo: HostingInfo | null;
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

export function HostingSection({ hostingInfo }: HostingSectionProps) {
  if (!hostingInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Server className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">Hosting information unavailable</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <InfoRow label="IP Address" value={hostingInfo.ip} icon={Wifi} />
      <InfoRow label="Hostname" value={hostingInfo.hostname} icon={Server} />
      <InfoRow
        label="Organization / ISP"
        value={hostingInfo.org}
        icon={Building2}
      />
      <InfoRow label="ASN" value={hostingInfo.asn} icon={Wifi} />
      <InfoRow label="City" value={hostingInfo.city} icon={MapPin} />
      <InfoRow label="Region" value={hostingInfo.region} icon={MapPin} />
      <InfoRow label="Country" value={hostingInfo.country} icon={MapPin} />
      <InfoRow label="Timezone" value={hostingInfo.timezone} icon={Server} />
      {hostingInfo.latitude && hostingInfo.longitude && (
        <div className="sm:col-span-2">
          <InfoRow
            label="Coordinates"
            value={`${hostingInfo.latitude}, ${hostingInfo.longitude}`}
            icon={MapPin}
          />
        </div>
      )}
    </div>
  );
}
