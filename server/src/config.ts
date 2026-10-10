import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.resolve(serverRoot, "../.env") });
dotenv.config({ path: path.resolve(serverRoot, ".env") });

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function databasePath(): string {
  const configured = process.env.DATABASE_PATH ?? path.join("data", "kitchen.db");
  return path.isAbsolute(configured) ? configured : path.resolve(serverRoot, configured);
}

export const config = {
  port: numberFromEnv("PORT", 3001),
  mockAgents: (process.env.MOCK_AGENTS ?? "true") === "true",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  databasePath: databasePath(),
  priceInputPerMtok: numberFromEnv("PRICE_INPUT_PER_MTOK", 3),
  priceOutputPerMtok: numberFromEnv("PRICE_OUTPUT_PER_MTOK", 15),
  sandboxPath: path.resolve(serverRoot, "sandbox"),
};
