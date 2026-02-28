import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSession,
  deleteSession,
  fetchSessionOutput,
  fetchSessions,
  sendKeys,
  type CreateSessionBody,
  type SendKeysBody,
} from './requests';

const SESSIONS_KEY = ['sessions'] as const;

export function useSessions() {
  return useQuery({ queryKey: SESSIONS_KEY, queryFn: fetchSessions });
}

export function useSessionOutput(id: string, enabled = true) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, id, 'output'],
    queryFn: () => fetchSessionOutput(id),
    refetchInterval: enabled ? 1000 : false,
    enabled,
  });
}

export function useCreateSession() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSessionBody) => createSession(body),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useSendKeys() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SendKeysBody }) =>
      sendKeys(id, body),
  });
}

export function useDeleteSession() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}
