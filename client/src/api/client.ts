import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export function agentTerminalWsUrl(agentId: string): string {
  return `/api/agents/${agentId}/terminal/ws`;
}
