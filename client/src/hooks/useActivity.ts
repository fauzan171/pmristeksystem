import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity.api';
import type { PaginationParams } from '../types';

export function useActivity(projectId?: string, params?: PaginationParams & { action?: string }) {
  if (projectId) {
    return useQuery({
      queryKey: ['activity', projectId, params],
      queryFn: () => activityApi.getByProject(projectId, params),
      enabled: !!projectId,
    });
  }
  return useQuery({
    queryKey: ['activity', params],
    queryFn: () => activityApi.getAll(params),
  });
}
