import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(serverRoot, "../.env") });

const port = process.env.PORT ?? "3001";
const url = `http://127.0.0.1:${port}/api/demo`;

try {
  const response = await fetch(url, { method: "POST" });
  const body = await response.text();
  if (!response.ok) {
    console.error(body);
    process.exit(1);
  }
  console.log(body);
} catch (error) {
  console.error(`Could not reach ${url}. Start the server with npm run dev.`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
