import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configsApi } from '../lib/api';
import type { CreateConfigPayload, UpdateConfigPayload, QualityCheckPreviewPayload } from '../types';

export function useConfigs() {
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll(),
  });
}

export function useConfig(configId: string | undefined) {
  return useQuery({
    queryKey: ['configs', configId],
    queryFn: () => configsApi.getById(configId!),
    enabled: !!configId,
  });
}

export function useCreateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConfigPayload) => configsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ configId, payload }: { configId: string; payload: UpdateConfigPayload }) =>
      configsApi.update(configId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: string) => configsApi.delete(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useDuplicateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: string) => configsApi.duplicate(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useQualityCheck() {
  return useMutation({
    mutationFn: (payload: QualityCheckPreviewPayload) => configsApi.qualityCheck(payload),
  });
}
