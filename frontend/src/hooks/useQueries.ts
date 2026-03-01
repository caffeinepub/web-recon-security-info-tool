import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ScanResult } from '../backend';

export function useGetScanHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getScanHistory();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetScan(domain: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ScanResult | null>({
    queryKey: ['scan', domain],
    queryFn: async () => {
      if (!actor || !domain) return null;
      try {
        return await actor.getScan(domain);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!domain,
  });
}

export function useSaveScan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      domain: string;
      subdomains: string[];
      hostingInfo: string;
      whoisData: string;
      dnsRecords: string;
      sslCertDetails: string;
      httpHeaders: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveScan(
        params.domain,
        params.subdomains,
        params.hostingInfo,
        params.whoisData,
        params.dnsRecords,
        params.sslCertDetails,
        params.httpHeaders
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    },
  });
}
