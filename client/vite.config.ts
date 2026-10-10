import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readPort(): string {
  try {
    const text = fs.readFileSync(path.join(root, ".env"), "utf8");
    const match = text.match(/^PORT\s*=\s*(\d+)\s*$/m);
    if (match?.[1]) return match[1];
  } catch {
    // Use the server default when .env is missing.
  }
  return "3001";
}

const port = readPort();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kitchen/shared": path.join(root, "shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [root] },
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${port}`,
        changeOrigin: true,
      },
      "/health": {
        target: `http://127.0.0.1:${port}`,
        changeOrigin: true,
      },
      "/line": {
        target: `http://127.0.0.1:${port}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
