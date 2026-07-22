import { api } from "./client";
import type { BotChartData } from "../types/chart";

export async function fetchBotChart(
  botId: number,
  limit = 80,
): Promise<BotChartData> {
  const res = await api.get<BotChartData>(`/bots/${botId}/chart`, {
    params: { limit },
    timeout: 45000,
  });
  return res.data;
}
