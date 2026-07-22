import { api } from "./client";
import type { Bot, BotLog, BotTrade, DashboardOverview } from "../types/bot";

function normalizeBot(raw: Record<string, unknown>): Bot {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    symbol: String(raw.symbol ?? raw.pair ?? ""),
    pair: String(raw.pair ?? raw.symbol ?? ""),
    strategy: String(raw.strategy ?? ""),
    timeframe: String(raw.timeframe ?? ""),
    status:
      raw.status === "running"
        ? "running"
        : raw.status === "error"
          ? "error"
          : "stopped",
    profit: Number(raw.profitNet ?? raw.profit) || 0,
    profitNet: Number(raw.profitNet ?? raw.profit) || 0,
    totalFeesUsdt: Number(raw.totalFeesUsdt ?? 0) || 0,
    unrealizedPnl:
      raw.unrealizedPnl == null ? null : Number(raw.unrealizedPnl),
    unrealizedPnlPercent:
      raw.unrealizedPnlPercent == null
        ? null
        : Number(raw.unrealizedPnlPercent),
    openPosition: (raw.openPosition as Bot["openPosition"]) ?? null,
    trades: Number(raw.trades) || 0,
    winRate: Number(raw.winRate ?? raw.win_rate) || 0,
    paperBalance: Number(raw.paperBalance ?? raw.paper_balance) || 1000,
    color: String(raw.color ?? "#22333B"),
    icon: String(raw.icon ?? "analytics"),
    parameters: (raw.parameters as Record<string, unknown>) ?? {},
    tradingMode: String(
      raw.tradingMode ??
        (raw.parameters as Record<string, unknown>)?.trading_mode ??
        "paper",
    ),
    description: raw.description ? String(raw.description) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export async function fetchBots(): Promise<Bot[]> {
  const res = await api.get("/bots/");
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map((raw) => normalizeBot(raw as Record<string, unknown>));
}

export async function startBot(botId: number) {
  const res = await api.post(`/bots/${botId}/start`);
  return res.data;
}

export async function stopBot(botId: number) {
  const res = await api.post(`/bots/${botId}/stop`);
  return res.data;
}

export async function fetchBotLogs(botId: number): Promise<BotLog[]> {
  const res = await api.get(`/bots/${botId}/logs`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchBotTrades(botId: number): Promise<BotTrade[]> {
  const res = await api.get(`/bots/${botId}/trades`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchDashboard(): Promise<DashboardOverview | null> {
  try {
    const res = await api.get<DashboardOverview>("/dashboard/overview");
    return res.data;
  } catch {
    return null;
  }
}
