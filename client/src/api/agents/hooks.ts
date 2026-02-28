import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAgent,
  deleteAgent,
  fetchAgents,
  updateAgent,
  type CreateAgentBody,
  type UpdateAgentBody,
} from './requests';

const AGENTS_KEY = ['agents'] as const;

export function useAgents() {
  return useQuery({ queryKey: AGENTS_KEY, queryFn: fetchAgents });
}

export function useCreateAgent() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAgentBody) => createAgent(body),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useUpdateAgent() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAgentBody }) =>
      updateAgent(id, body),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useDeleteAgent() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}
