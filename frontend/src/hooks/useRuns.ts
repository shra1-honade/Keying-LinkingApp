import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '../lib/api';
import type { CreateRunPayload } from '../types';

export function useRuns(status?: string) {
  return useQuery({
    queryKey: ['runs', status],
    queryFn: () => runsApi.getAll(status),
    refetchInterval: (query) => {
      const runs = query.state.data;
      const hasInProgress = runs?.some(
        (run) => run.status === 'in_progress' || run.status === 'queued'
      );
      return hasInProgress ? 5000 : false;
    },
  });
}

export function useRun(runId: string | undefined) {
  return useQuery({
    queryKey: ['runs', runId],
    queryFn: () => runsApi.getById(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const run = query.state.data;
      return run?.status === 'in_progress' || run?.status === 'queued' ? 3000 : false;
    },
  });
}

export function useRunResults(
  runId: string | undefined,
  params?: {
    page?: number;
    page_size?: number;
    min_score?: number;
    search?: string;
    show_unmatched?: boolean;
  }
) {
  return useQuery({
    queryKey: ['runs', runId, 'results', params],
    queryFn: () => runsApi.getResults(runId!, params),
    enabled: !!runId,
  });
}

export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRunPayload) => runsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useDownloadResults() {
  return useMutation({
    mutationFn: (runId: string) => runsApi.download(runId),
  });
}

export function useDeleteRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => runsApi.delete(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
