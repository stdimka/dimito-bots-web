import { API_BASE_URL } from "./client";
import type { BotLog } from "../types/bot";

export type WsStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

function wsBaseUrl(): string {
  return API_BASE_URL.replace(/^http/, "ws");
}

/**
 * Subscribe to live bot logs over WebSocket.
 * Returns cleanup (close + clear reconnect).
 */
export function connectBotLogs(
  botId: number,
  onLog: (log: BotLog) => void,
  onStatus?: (status: WsStatus) => void,
): () => void {
  let socket: WebSocket | null = null;
  let intentionalClose = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const maxDelay = 30000;

  const emit = (s: WsStatus) => onStatus?.(s);

  const open = () => {
    if (intentionalClose) return;
    emit(attempt > 0 ? "reconnecting" : "connecting");
    const url = `${wsBaseUrl()}/ws/logs/${botId}`;
    socket = new WebSocket(url);

    socket.onopen = () => {
      attempt = 0;
      emit("connected");
    };

    socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (raw.type === "ping") return;
        onLog(raw as unknown as BotLog);
      } catch {
        // ignore parse errors
      }
    };

    socket.onerror = () => {
      // close will fire reconnect
    };

    socket.onclose = () => {
      socket = null;
      if (intentionalClose) {
        emit("disconnected");
        return;
      }
      emit("reconnecting");
      const delay = Math.min(1000 * 2 ** attempt, maxDelay);
      attempt += 1;
      timer = setTimeout(open, delay);
    };
  };

  open();

  return () => {
    intentionalClose = true;
    if (timer) clearTimeout(timer);
    if (socket) {
      try {
        socket.close();
      } catch {
        // ignore
      }
    }
    emit("disconnected");
  };
}
