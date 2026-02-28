import { api } from '../client';

export type SessionStatus = 'running' | 'stopped' | 'error';

export type ApiSession = {
  id: string;
  agentId: string;
  zoneId: string;
  tmuxSessionName: string;
  status: SessionStatus;
};

export type CreateSessionBody = {
  agentId: string;
  zoneId: string;
};

export type SendKeysBody = {
  keys: string;
};

export async function fetchSessions() {
  const { data } = await api.get<ApiSession[]>('/sessions');
  return data;
}

export async function fetchSession(id: string) {
  const { data } = await api.get<ApiSession>(`/sessions/${id}`);
  return data;
}

export async function createSession(body: CreateSessionBody) {
  const { data } = await api.post<ApiSession>('/sessions', body);
  return data;
}

export async function fetchSessionOutput(id: string) {
  const { data } = await api.get<{ output: string }>(`/sessions/${id}/output`);
  return data;
}

export async function sendKeys(id: string, body: SendKeysBody) {
  await api.post(`/sessions/${id}/send`, body);
}

export async function deleteSession(id: string) {
  await api.delete(`/sessions/${id}`);
}
