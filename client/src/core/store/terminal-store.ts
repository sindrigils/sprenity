import { create } from 'zustand';

type TerminalStore = {
  activeAgentId: string | null;
  activeAgentName: string | null;
  openTerminal: (agentId: string, agentName: string) => void;
  closeTerminal: () => void;
};

export const useTerminalStore = create<TerminalStore>((set) => ({
  activeAgentId: null,
  activeAgentName: null,
  openTerminal: (agentId, agentName) =>
    set({ activeAgentId: agentId, activeAgentName: agentName }),
  closeTerminal: () => set({ activeAgentId: null, activeAgentName: null }),
}));
