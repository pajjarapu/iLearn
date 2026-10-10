import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { subscribe } from "./hub";
import { snapshot } from "./line";

const sockets = new Set<WebSocket>();

export function attachWebSocket(server: HttpServer): () => void {
  const wss = new WebSocketServer({ server, path: "/line" });

  const unsubscribe = subscribe((message) => {
    const data = JSON.stringify(message);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    }
  });

  wss.on("connection", (socket) => {
    sockets.add(socket);
    socket.send(JSON.stringify({ type: "snapshot", state: snapshot() }));
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => sockets.delete(socket));
  });

  return () => {
    unsubscribe();
    for (const socket of sockets) socket.close();
    sockets.clear();
    wss.close();
  };
}
