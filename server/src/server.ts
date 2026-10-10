import http from "node:http";
import { closeDb, initDb } from "./db";
import { createHttpApp } from "./http";
import { recoverInterrupted } from "./line";
import { attachWebSocket } from "./ws";
import { ensureSandbox } from "./workspace";

export async function startServer(port: number): Promise<{ port: number; close: () => Promise<void> }> {
  initDb();
  ensureSandbox();
  recoverInterrupted();

  const app = createHttpApp();
  const server = http.createServer(app);
  const detach = attachWebSocket(server);

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error);
    server.once("error", onError);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", onError);
      resolve();
    });
  });

  const address = server.address();
  const actual = typeof address === "object" && address ? address.port : port;

  return {
    port: actual,
    close: async () => {
      detach();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      closeDb();
    },
  };
}
