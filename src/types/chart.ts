export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

export interface TradeMarker {
  kind: "entry" | "exit";
  side: string;
  price: number;
  t: number;
  trade_id?: number;
  pnl_usdt?: number | null;
  exit_reason?: string | null;
}

export interface BotChartData {
  symbol: string;
  timeframe: string;
  last_price: number | null;
  candles: Candle[];
  markers: TradeMarker[];
}
