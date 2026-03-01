import { Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DnsRecord } from '../services/reconApi';

interface DnsRecordsSectionProps {
  dnsRecords: DnsRecord[];
}

const TYPE_COLORS: Record<string, string> = {
  A: 'bg-cyber-green/10 text-cyber-green border-cyber-green-dim',
  AAAA: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan-dim',
  MX: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  NS: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  TXT: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CNAME: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  SOA: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  PTR: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
};

export function DnsRecordsSection({ dnsRecords }: DnsRecordsSectionProps) {
  if (dnsRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Database className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-mono text-sm">No DNS records found</p>
      </div>
    );
  }

  const grouped = dnsRecords.reduce<Record<string, DnsRecord[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(grouped).map(type => (
          <Badge key={type} className={`font-mono text-xs ${TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
            {type} ({grouped[type].length})
          </Badge>
        ))}
      </div>
      <ScrollArea className="h-72">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-mono text-xs text-muted-foreground uppercase tracking-wider w-20">Type</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dnsRecords.map((record, i) => (
              <TableRow key={i} className="border-border/30 hover:bg-cyber-surface1/50">
                <TableCell className="py-2">
                  <Badge className={`font-mono text-xs ${TYPE_COLORS[record.type] || 'bg-muted text-muted-foreground'}`}>
                    {record.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground py-2 break-all">
                  {record.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
