import type { Cook, Order, Ticket } from "@kitchen/shared";

export function money(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

export function tokens(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ticketElapsed(ticket: Ticket, now: number): number {
  if (!ticket.startedAt) return 0;
  return (ticket.finishedAt ?? now) - ticket.startedAt;
}

export function ticketHeat(ticket: Ticket, now: number): { level: "ok" | "warm" | "hot"; label: string } {
  const ratio = ticket.budgetUsd > 0 ? ticket.costUsd / ticket.budgetUsd : 0;
  const minutes = ticketElapsed(ticket, now) / 60_000;
  const overBudget = ratio >= 1;
  const old = minutes >= 5;
  const warmBudget = ratio >= 0.5;
  const warmTime = minutes >= 2;

  if (overBudget && old) return { level: "hot", label: "Over budget and past 5 minutes" };
  if (overBudget) return { level: "hot", label: "Over budget" };
  if (old) return { level: "hot", label: "Past 5 minutes" };
  if (warmBudget && warmTime) return { level: "warm", label: "Over half the budget and past 2 minutes" };
  if (warmBudget) return { level: "warm", label: "Over half the budget" };
  if (warmTime) return { level: "warm", label: "Past 2 minutes" };
  return { level: "ok", label: "On pace" };
}

export function orderElapsed(order: Order, tickets: Ticket[], now: number): number {
  if (order.status === "served" && order.servedAt) return order.servedAt - order.createdAt;
  if (order.status === "ready" || order.status === "cancelled") {
    const ends = tickets.map((ticket) => ticket.finishedAt).filter((value): value is number => value != null);
    const end = ends.length > 0 ? Math.max(...ends) : order.createdAt;
    return Math.max(0, end - order.createdAt);
  }
  return Math.max(0, now - order.createdAt);
}

export function cookTotals(tickets: Ticket[], cooks: Cook[]): Array<{ cook: Cook; cost: number }> {
  return cooks
    .map((cook) => ({
      cook,
      cost: tickets.filter((ticket) => ticket.cookId === cook.id).reduce((sum, ticket) => sum + ticket.costUsd, 0),
    }))
    .sort((a, b) => b.cost - a.cost);
}

export function stamp(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
