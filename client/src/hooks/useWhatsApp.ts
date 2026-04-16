import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '../api/whatsapp.api';
import { notificationsApi } from '../api/notifications.api';
import type { WASendMessageRequest } from '../types';

/** Poll WA connection status every 10s */
export function useWAStatus() {
  return useQuery({
    queryKey: ['wa-status'],
    queryFn: () => whatsappApi.getStatus(),
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}

/** Initiate WA connection (returns QR code) */
export function useWAConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappApi.connect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-status'] });
    },
  });
}

/** Disconnect WA */
export function useWADisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-status'] });
    },
  });
}

/** Fetch WA groups (enabled only when connected) */
export function useWAGroups(enabled: boolean) {
  return useQuery({
    queryKey: ['wa-groups'],
    queryFn: () => whatsappApi.getGroups(),
    enabled,
    staleTime: 60_000,
  });
}

/** Send a single notification message */
export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WASendMessageRequest) => whatsappApi.sendMessage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** Broadcast all project updates via WhatsApp */
export function useBroadcastAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.sendAllUpdates(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
