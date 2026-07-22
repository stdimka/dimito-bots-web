import { create } from "zustand";
import {
  fetchBots,
  fetchDashboard,
  startBot,
  stopBot,
} from "../api/bots";
import { getApiErrorMessage } from "../api/client";
import type { Bot, DashboardOverview } from "../types/bot";

interface BotsState {
  bots: Bot[];
  dashboard: DashboardOverview | null;
  loading: boolean;
  togglingId: number | null;
  error: string | null;
  fetchBots: () => Promise<void>;
  toggleBot: (botId: number) => Promise<void>;
  reset: () => void;
}

export const useBotsStore = create<BotsState>((set, get) => ({
  bots: [],
  dashboard: null,
  loading: false,
  togglingId: null,
  error: null,

  reset: () =>
    set({ bots: [], dashboard: null, loading: false, error: null, togglingId: null }),

  fetchBots: async () => {
    set({ loading: true, error: null });
    try {
      const [bots, dashboard] = await Promise.all([
        fetchBots(),
        fetchDashboard(),
      ]);
      set({ bots, dashboard, loading: false });
    } catch (e) {
      set({ loading: false, error: getApiErrorMessage(e) });
    }
  },

  toggleBot: async (botId) => {
    const bot = get().bots.find((b) => b.id === botId);
    if (!bot) return;
    set({ togglingId: botId, error: null });
    try {
      if (bot.status === "running") {
        await stopBot(botId);
      } else {
        await startBot(botId);
      }
      await get().fetchBots();
    } catch (e) {
      set({ error: getApiErrorMessage(e) });
    } finally {
      set({ togglingId: null });
    }
  },
}));
