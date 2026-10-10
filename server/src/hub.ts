import type { ServerMessage } from "@kitchen/shared";

type Listener = (message: ServerMessage) => void;

const listeners = new Set<Listener>();

export function publish(message: ServerMessage): void {
  for (const listener of listeners) listener(message);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
