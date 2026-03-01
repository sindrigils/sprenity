import { closeAgentTerminal, openAgentTerminal } from '@api/agents/requests';
import { agentTerminalWsUrl } from '@api/client';
import { useTerminalStore } from '@core/store/terminal-store';
import { IconClose } from '@ui/icons';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef } from 'react';

type AgentTerminalSidebarProps = {
  isOpen: boolean;
};

type TerminalSnapshotMessage = {
  type: 'snapshot';
  output: string;
  cursorX: number;
  cursorY: number;
  paneWidth: number;
  paneHeight: number;
};

type TerminalOutputMessage = {
  type: 'output';
  data: string;
};

type TerminalSocketMessage = TerminalSnapshotMessage | TerminalOutputMessage;

const STREAM_OPEN_STATES = new Set<number>([
  WebSocket.OPEN,
  WebSocket.CONNECTING,
]);

export function AgentTerminalSidebar({ isOpen }: AgentTerminalSidebarProps) {
  const activeAgentId = useTerminalStore((state) => state.activeAgentId);
  const activeAgentName = useTerminalStore((state) => state.activeAgentName);
  const closeTerminal = useTerminalStore((state) => state.closeTerminal);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!activeAgentId || !terminalRef.current) return;

    const sessionAgentId = activeAgentId;
    let disposed = false;
    let inputFlushTimer: number | null = null;
    let resizeFlushTimer: number | null = null;
    let postOpenFitTimer: number | null = null;
    let pendingInput = '';
    let socket: WebSocket | null = null;

    const terminal = new Terminal({
      convertEol: true,
      disableStdin: false,
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      scrollback: 10_000,
      theme: {
        background: '#0B0F17',
        foreground: '#E5E7EB',
      },
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    const sendResize = () => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const cols = Math.max(2, terminal.cols);
      const rows = Math.max(2, terminal.rows);
      socket.send(JSON.stringify({ type: 'resize', cols, rows }));
    };

    const scheduleResize = () => {
      if (resizeFlushTimer !== null) return;
      resizeFlushTimer = window.setTimeout(() => {
        resizeFlushTimer = null;
        sendResize();
      }, 40);
    };

    const flushPendingInput = () => {
      if (
        !socket ||
        socket.readyState !== WebSocket.OPEN ||
        pendingInput.length === 0
      ) {
        return;
      }
      socket.send(JSON.stringify({ type: 'input', data: pendingInput }));
      pendingInput = '';
    };

    const queueInput = (data: string) => {
      pendingInput += data;
      if (inputFlushTimer !== null) return;

      inputFlushTimer = window.setTimeout(() => {
        inputFlushTimer = null;
        flushPendingInput();
      }, 16);
    };

    const renderSnapshot = (message: TerminalSnapshotMessage) => {
      terminal.write('\x1b[?25l');
      terminal.write('\x1b[3J\x1b[H\x1b[2J');
      if (message.output) {
        terminal.write(message.output);
      }

      const safeCursorX = Math.max(
        0,
        Math.min(message.cursorX, Math.max(0, message.paneWidth - 1)),
      );
      const safeCursorY = Math.max(
        0,
        Math.min(message.cursorY, Math.max(0, message.paneHeight - 1)),
      );
      terminal.write(`\x1b[${safeCursorY + 1};${safeCursorX + 1}H`);
      terminal.write('\x1b[?25h');
    };

    const fit = () => {
      fitAddonRef.current?.fit();
      scheduleResize();
    };
    const animationFrame = requestAnimationFrame(() => {
      fit();
      terminal.focus();
    });
    window.addEventListener('resize', fit);

    const inputDisposable = terminal.onData(queueInput);

    void (async () => {
      terminal.writeln('Starting terminal session...');
      try {
        await openAgentTerminal(sessionAgentId);
        if (disposed) return;

        socket = new WebSocket(agentTerminalWsUrl(sessionAgentId));
        socket.onopen = () => {
          if (disposed) return;
          terminal.writeln('Connected.\r\n');
          fit();
          flushPendingInput();
          postOpenFitTimer = window.setTimeout(() => {
            if (!disposed) fit();
          }, 260);
        };
        socket.onmessage = (event: MessageEvent<string>) => {
          if (disposed) return;
          let parsed: TerminalSocketMessage | null = null;
          try {
            parsed = JSON.parse(event.data) as TerminalSocketMessage;
          } catch {
            return;
          }

          if (parsed.type === 'snapshot') {
            renderSnapshot(parsed);
            return;
          }

          if (parsed.type === 'output' && parsed.data) {
            terminal.write(parsed.data);
          }
        };
        socket.onclose = () => {
          if (!disposed) terminal.writeln('\r\n[terminal stream closed]');
        };
        socket.onerror = () => {
          if (!disposed) terminal.writeln('\r\n[terminal stream error]');
        };
      } catch {
        if (!disposed) terminal.writeln('\r\n[failed to start terminal]');
      }
    })();

    return () => {
      disposed = true;
      if (inputFlushTimer !== null) {
        window.clearTimeout(inputFlushTimer);
      }
      if (resizeFlushTimer !== null) {
        window.clearTimeout(resizeFlushTimer);
      }
      if (postOpenFitTimer !== null) {
        window.clearTimeout(postOpenFitTimer);
      }
      pendingInput = '';
      if (socket && STREAM_OPEN_STATES.has(socket.readyState)) {
        socket.close();
      }
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', fit);
      inputDisposable.dispose();
      fitAddonRef.current = null;
      terminal.dispose();
      void closeAgentTerminal(sessionAgentId).catch(() => {});
    };
  }, [activeAgentId]);

  useEffect(() => {
    if (!isOpen) return;
    const animationFrame = requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
    });
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isOpen]);

  return (
    <aside
      data-testid="agent-terminal-sidebar"
      className={`absolute inset-y-0 right-0 z-30 h-full overflow-hidden bg-[#10141f] transition-[width] duration-[220ms] ease-out ${
        isOpen ? 'border-l border-[#2a2b3d]' : 'border-l border-transparent'
      }`}
      style={{ width: isOpen ? 520 : 0 }}
    >
      <div
        className={`h-full w-[520px] transition-all duration-[180ms] ease-out ${
          isOpen
            ? 'translate-x-0 opacity-100'
            : 'translate-x-3 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-[#2a2b3d] px-4">
          <div className="text-sm font-semibold text-gray-200">
            {activeAgentName ?? 'Terminal'}
          </div>
          <button
            onClick={closeTerminal}
            className="cursor-pointer border-none bg-transparent p-2 text-gray-400 transition-colors hover:text-white"
            aria-label="Close terminal"
            data-testid="agent-terminal-close"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] w-full bg-[#0B0F17] p-3">
          <div
            ref={terminalRef}
            data-testid="agent-terminal-surface"
            className="h-full w-full"
          />
        </div>
      </div>
    </aside>
  );
}
