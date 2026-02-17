import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '../lib/api';
import type { UpdatePreferencesPayload } from '../types';

export function usePreferences(orgId: string = 'demo_org') {
  return useQuery({
    queryKey: ['preferences', orgId],
    queryFn: () => preferencesApi.get(orgId),
  });
}

export function useUpdatePreferences(orgId: string = 'demo_org') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePreferencesPayload) =>
      preferencesApi.update(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}
