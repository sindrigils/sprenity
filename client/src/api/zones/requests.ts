import { api } from '../client';

export type GridCell = {
  x: number;
  z: number;
};

export type ApiZone = {
  id: string;
  name: string;
  startCell: GridCell;
  endCell: GridCell;
  color: string;
  projectPath: string | null;
};

export type CreateZoneBody = {
  name: string;
  startCell: GridCell;
  endCell: GridCell;
  color: string;
  projectPath?: string | null;
};

export type UpdateZoneBody = {
  name?: string;
  startCell?: GridCell;
  endCell?: GridCell;
  color?: string;
  projectPath?: string | null;
};

export async function fetchZones() {
  const { data } = await api.get<ApiZone[]>('/zones');
  return data;
}

export async function fetchZone(id: string) {
  const { data } = await api.get<ApiZone>(`/zones/${id}`);
  return data;
}

export async function createZone(body: CreateZoneBody) {
  const { data } = await api.post<ApiZone>('/zones', body);
  return data;
}

export async function updateZone(id: string, body: UpdateZoneBody) {
  const { data } = await api.patch<ApiZone>(`/zones/${id}`, body);
  return data;
}

export async function deleteZone(id: string) {
  await api.delete(`/zones/${id}`);
}
