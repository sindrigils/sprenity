import { api } from '../client';

export type ClaudeModel = 'claude-sonnet' | 'claude-opus' | 'claude-haiku';

export type CharacterModel =
  | 'Barbarian'
  | 'Knight'
  | 'Mage'
  | 'Ranger'
  | 'Rogue'
  | 'Rogue_Hooded';

export type ApiAgent = {
  id: string;
  name: string;
  model: ClaudeModel;
  characterModel: CharacterModel;
};

export type CreateAgentBody = {
  name: string;
  model?: ClaudeModel;
  characterModel?: CharacterModel;
};

export type UpdateAgentBody = {
  name?: string;
  model?: ClaudeModel;
  characterModel?: CharacterModel;
};

export async function fetchAgents() {
  const { data } = await api.get<ApiAgent[]>('/agents');
  return data;
}

export async function fetchAgent(id: string) {
  const { data } = await api.get<ApiAgent>(`/agents/${id}`);
  return data;
}

export async function createAgent(body: CreateAgentBody) {
  const { data } = await api.post<ApiAgent>('/agents', body);
  return data;
}

export async function updateAgent(id: string, body: UpdateAgentBody) {
  const { data } = await api.patch<ApiAgent>(`/agents/${id}`, body);
  return data;
}

export async function deleteAgent(id: string) {
  await api.delete(`/agents/${id}`);
}
