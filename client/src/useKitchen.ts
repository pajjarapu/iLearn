import { useEffect, useState } from "react";
import type { Cook, KitchenEvent, KitchenState, Order, ServerMessage, Ticket } from "@kitchen/shared";

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) return [...items, item];
  const next = items.slice();
  next[index] = item;
  return next;
}

function reduceState(state: KitchenState, message: ServerMessage): KitchenState {
  switch (message.type) {
    case "snapshot":
      return message.state;
    case "event":
      if (state.events.some((event) => event.id === message.event.id)) return state;
      return { ...state, events: [...state.events, message.event].slice(-300) };
    case "ticket":
      return { ...state, tickets: upsert(state.tickets, message.ticket) };
    case "order":
      return { ...state, orders: upsert(state.orders, message.order) };
    case "cook":
      return { ...state, cooks: upsert(state.cooks, message.cook) };
  }
}

export type LineLink = "connecting" | "live" | "reconnecting";

export function useKitchen(): {
  state: KitchenState | null;
  link: LineLink;
} {
  const [state, setState] = useState<KitchenState | null>(null);
  const [link, setLink] = useState<LineLink>("connecting");

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let retry = 0;

    const connect = () => {
      if (stopped) return;
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${protocol}://${window.location.host}/line`);
      socket.onopen = () => {
        if (!stopped) setLink("live");
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        setState((current) => {
          if (message.type === "snapshot") return message.state;
          if (!current) return current;
          return reduceState(current, message);
        });
      };
      socket.onclose = () => {
        if (!stopped) {
          setLink("reconnecting");
          retry = window.setTimeout(connect, 800);
        }
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retry);
      socket?.close();
    };
  }, []);

  return { state, link };
}

export type { Cook, KitchenEvent, Order, Ticket };
