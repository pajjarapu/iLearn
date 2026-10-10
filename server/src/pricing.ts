import { config } from "./config";

export function costUsd(inputTokens: number, outputTokens: number): number {
  const raw =
    (inputTokens / 1_000_000) * config.priceInputPerMtok +
    (outputTokens / 1_000_000) * config.priceOutputPerMtok;
  return Math.round(raw * 1_000_000) / 1_000_000;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

export function formatTokenCount(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}
