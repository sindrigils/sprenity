import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createZone,
  deleteZone,
  fetchZones,
  updateZone,
  type CreateZoneBody,
  type UpdateZoneBody,
} from './requests';

const ZONES_KEY = ['zones'] as const;

export function useZones() {
  return useQuery({ queryKey: ZONES_KEY, queryFn: fetchZones });
}

export function useCreateZone() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneBody) => createZone(body),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}

export function useUpdateZone() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateZoneBody }) =>
      updateZone(id, body),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}

export function useDeleteZone() {
  const queryclient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteZone(id),
    onSuccess: () => queryclient.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}
