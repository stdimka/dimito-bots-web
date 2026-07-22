export interface Bot {
  id: number;
  name: string;
  symbol: string;
  pair?: string;
  strategy: string;
  timeframe: string;
  status: "stopped" | "running" | "error";
  profit: number;
  profitNet?: number;
  totalFeesUsdt?: number;
  unrealizedPnl?: number | null;
  unrealizedPnlPercent?: number | null;
  openPosition?: {
    side: string;
    entryPrice: number;
    markPrice: number;
    quantity: number;
    openedAt?: string | null;
  } | null;
  trades: number;
  winRate: number;
  paperBalance?: number;
  color: string;
  icon: string;
  parameters: Record<string, unknown>;
  tradingMode?: string;
  description?: string;
  created_at?: string;
}

export interface BotLog {
  id?: number;
  bot_id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
}

export interface BotTrade {
  id?: number;
  side?: string;
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  pnl_net?: number;
  fee?: number;
  opened_at?: string;
  closed_at?: string;
  [key: string]: unknown;
}

export interface DashboardOverview {
  total_bots: number;
  running_count: number;
  total_profit: number;
  total_trades: number;
  error_count: number;
  best_bot: string | null;
  worst_bot: string | null;
}
