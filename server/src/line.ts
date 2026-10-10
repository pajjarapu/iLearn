import { randomBytes } from "node:crypto";
import type {
  Cook,
  KitchenEvent,
  KitchenState,
  Order,
  OrderDetail,
  OrderStatus,
  PlaceOrderInput,
  Station,
  Ticket,
  TicketStatus,
} from "@kitchen/shared";
import { burners } from "./burners";
import { config } from "./config";
import * as db from "./db";
import { HttpError } from "./errors";
import { publish } from "./hub";
import { costUsd, formatTokenCount, formatUsd } from "./pricing";
import {
  createWorkBranch,
  ensureSandbox,
  inspectRepo,
  listChangedFiles,
  normalizeTestCommand,
  resolveInside,
} from "./workspace";

const runs = new Map<string, AbortController>();
let generation = 0;

const OPEN_TICKET: TicketStatus[] = ["queued", "working", "waiting_burner", "paused", "sent_back"];
const TERMINAL_TICKET: TicketStatus[] = ["done", "ready_for_expo", "cancelled", "served"];

export function lineGeneration(): number {
  return generation;
}

export function registerRun(orderId: string, controller: AbortController): void {
  runs.set(orderId, controller);
}

export function unregisterRun(orderId: string): void {
  runs.delete(orderId);
}

export function abortRuns(): void {
  for (const controller of runs.values()) controller.abort();
  runs.clear();
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}

export function cookLabel(cookId: string): string {
  return db.getCook(cookId)?.name ?? cookId;
}

export function cookForStation(station: Station): Cook {
  const cook = db.listCooks().find((item) => item.station === station);
  if (!cook) throw new Error(`No cook is assigned to ${station}.`);
  return cook;
}

export function getTicket(id: string): Ticket | null {
  return db.getTicket(id);
}

function mustOrder(id: string): Order {
  const order = db.getOrder(id);
  if (!order) throw new Error(`Order ${id} is missing.`);
  return order;
}

function mustTicket(id: string): Ticket {
  const ticket = db.getTicket(id);
  if (!ticket) throw new Error(`Ticket ${id} is missing.`);
  return ticket;
}

export function snapshot(): KitchenState {
  const stationOrder: Record<Station, number> = {
    head_chef: 0,
    prep: 1,
    grill: 2,
    sauce: 3,
  };
  const cooks = db.listCooks().sort((a, b) => stationOrder[a.station] - stationOrder[b.station]);
  return {
    orders: db.listOrders(),
    tickets: db.listTickets(),
    events: db.listEvents(300),
    sendBacks: db.listSendBacks(),
    cooks,
    pricing: {
      inputPerMtok: config.priceInputPerMtok,
      outputPerMtok: config.priceOutputPerMtok,
    },
    mockAgents: config.mockAgents,
    workspace: db.workspaceSettings(),
  };
}

export function orderDetail(orderId: string): OrderDetail | null {
  const order = db.getOrder(orderId);
  if (!order) return null;
  const tickets = db.listTickets(orderId);
  const ticketIds = new Set(tickets.map((ticket) => ticket.id));
  return {
    order,
    tickets,
    events: db.listEventsForOrder(orderId),
    sendBacks: db.listSendBacks().filter((item) => ticketIds.has(item.ticketId)),
  };
}

export function postEvent(
  orderId: string,
  ticketId: string | null,
  type: string,
  message: string,
  payload: Record<string, unknown> = {},
): KitchenEvent {
  const event = db.insertEvent({
    orderId,
    ticketId,
    type,
    message,
    payload,
    createdAt: Date.now(),
  });
  publish({ type: "event", event });
  return event;
}

function syncCook(ticket: Ticket): void {
  const cook = db.getCook(ticket.cookId);
  if (!cook) return;

  let next = cook;
  if (ticket.status === "working") {
    next = { ...cook, status: "working", currentTicketId: ticket.id };
  } else if (ticket.status === "waiting_burner") {
    next = { ...cook, status: "waiting", currentTicketId: ticket.id };
  } else if (
    ticket.status === "done" ||
    ticket.status === "ready_for_expo" ||
    ticket.status === "cancelled" ||
    ticket.status === "served" ||
    ticket.status === "paused"
  ) {
    if (cook.currentTicketId === ticket.id) {
      next = { ...cook, status: "idle", currentTicketId: null };
    }
  }

  if (next !== cook) {
    db.saveCook(next);
    publish({ type: "cook", cook: next });
  }
}

export function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  event?: { type: string; message: string; payload?: Record<string, unknown> },
): Order {
  const order = mustOrder(orderId);
  const next: Order = {
    ...order,
    status,
    servedAt: status === "served" ? Date.now() : order.servedAt,
  };
  db.saveOrder(next);
  publish({ type: "order", order: next });
  if (event) postEvent(orderId, null, event.type, event.message, event.payload ?? {});
  return next;
}

export function setTicketStatus(
  ticketId: string,
  status: TicketStatus,
  event: { type: string; message: string; payload?: Record<string, unknown> },
): Ticket {
  const ticket = mustTicket(ticketId);
  const terminal = TERMINAL_TICKET.includes(status);
  const next: Ticket = {
    ...ticket,
    status,
    startedAt:
      ticket.startedAt ?? (status === "working" || status === "waiting_burner" ? Date.now() : null),
    finishedAt: terminal && ticket.finishedAt == null ? Date.now() : ticket.finishedAt,
  };
  db.saveTicket(next);
  publish({ type: "ticket", ticket: next });
  postEvent(next.orderId, next.id, event.type, event.message, event.payload ?? {});
  syncCook(next);
  return next;
}

export function workRootFor(order: Order): string {
  if (order.repoPath) return order.repoPath;
  if (order.mode === "mock") return ensureSandbox();
  throw new HttpError(403, "This order has no repo, so cooks cannot touch files.");
}

export function touchFile(ticketId: string, file: string): Ticket {
  const ticket = mustTicket(ticketId);
  const order = mustOrder(ticket.orderId);
  const { relative } = resolveInside(workRootFor(order), file);
  if (ticket.files.includes(relative)) return ticket;
  const next: Ticket = { ...ticket, files: [...ticket.files, relative] };
  db.saveTicket(next);
  publish({ type: "ticket", ticket: next });
  return next;
}

export function recordUsage(ticketId: string, input: number, output: number): Ticket {
  const current = mustTicket(ticketId);
  const inputTokens = current.inputTokens + input;
  const outputTokens = current.outputTokens + output;
  const nextCost = costUsd(inputTokens, outputTokens);
  const previousCost = current.costUsd;
  const budget = current.budgetUsd;
  const name = cookLabel(current.cookId);

  const ticket: Ticket = {
    ...current,
    inputTokens,
    outputTokens,
    costUsd: nextCost,
  };

  const events = db.runTransaction(() => {
    db.saveTicket(ticket);
    const written: KitchenEvent[] = [
      db.insertEvent({
        orderId: ticket.orderId,
        ticketId: ticket.id,
        type: "tokens.used",
        message: `${name} logged ${formatTokenCount(input)} in / ${formatTokenCount(output)} out. Food cost ${formatUsd(nextCost)}.`,
        payload: {
          inputTokens: input,
          outputTokens: output,
          totalInputTokens: inputTokens,
          totalOutputTokens: outputTokens,
          costUsd: nextCost,
          budgetUsd: budget,
          mock: true,
        },
        createdAt: Date.now(),
      }),
    ];

    const previousRatio = budget > 0 ? previousCost / budget : 0;
    const nextRatio = budget > 0 ? nextCost / budget : 0;
    if (previousRatio < 0.5 && nextRatio >= 0.5) {
      written.push(
        db.insertEvent({
          orderId: ticket.orderId,
          ticketId: ticket.id,
          type: "budget.warning",
          message: `${name} crossed half the ticket budget (${formatUsd(nextCost)} of ${formatUsd(budget)}).`,
          payload: { costUsd: nextCost, budgetUsd: budget },
          createdAt: Date.now(),
        }),
      );
    }
    if (previousRatio < 1 && nextRatio >= 1) {
      written.push(
        db.insertEvent({
          orderId: ticket.orderId,
          ticketId: ticket.id,
          type: "budget.exceeded",
          message: `${name} is over the ticket budget (${formatUsd(nextCost)} of ${formatUsd(budget)}).`,
          payload: { costUsd: nextCost, budgetUsd: budget },
          createdAt: Date.now(),
        }),
      );
    }
    return written;
  });

  publish({ type: "ticket", ticket });
  for (const event of events) publish({ type: "event", event });
  return ticket;
}

export function openTicket(input: {
  orderId: string;
  station: Station;
  cook: Cook;
  title: string;
  detail: string;
  budgetUsd: number;
}): Ticket {
  const ticket: Ticket = {
    id: newId("tkt"),
    orderId: input.orderId,
    station: input.station,
    cookId: input.cook.id,
    title: input.title,
    detail: input.detail,
    status: "queued",
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    budgetUsd: input.budgetUsd,
    files: [],
    startedAt: null,
    finishedAt: null,
    createdAt: Date.now(),
  };
  db.insertTicket(ticket);
  publish({ type: "ticket", ticket });
  postEvent(
    ticket.orderId,
    ticket.id,
    "ticket.created",
    `${input.cook.name} picked up ${input.title}.`,
    { station: input.station, cookId: input.cook.id },
  );
  return ticket;
}

function rememberWorkspace(input: PlaceOrderInput, testCommand: string): void {
  db.setSetting("testCommand", testCommand);
  if (input.repoPath === undefined) return;
  const typed = input.repoPath.trim();
  db.setSetting("repoPath", typed ? inspectRepo(typed).repoPath : "");
}

export function placeOrder(input: PlaceOrderInput): Order {
  const title = input.title.trim();
  if (!title) throw new HttpError(400, "The order needs a title.");
  if (title.length > 300) throw new HttpError(400, "Keep the order under 300 characters.");

  const acceptanceCriteria = (input.acceptanceCriteria ?? []).map((item) => item.trim()).filter(Boolean);
  if (acceptanceCriteria.length > 12) {
    throw new HttpError(400, "Use 12 acceptance criteria or fewer.");
  }

  let ticketBudgetUsd = input.ticketBudgetUsd ?? 0.25;
  if (!Number.isFinite(ticketBudgetUsd) || ticketBudgetUsd <= 0 || ticketBudgetUsd > 100) {
    throw new HttpError(400, "Ticket budget must be a dollar amount above 0 and at most 100.");
  }
  ticketBudgetUsd = Math.round(ticketBudgetUsd * 10_000) / 10_000;

  const testCommand = normalizeTestCommand(input.testCommand ?? db.getSetting("testCommand") ?? undefined);
  rememberWorkspace(input, testCommand);

  const active = db.listOrders().find((order) => order.status === "placed" || order.status === "cooking");
  if (active) {
    throw new HttpError(409, "An order is already on the line. Clear it before firing another.");
  }

  let repoPath: string | null = null;
  let branch: string | null = null;
  let baseSha: string | null = null;
  const savedRepo = db.getSetting("repoPath");
  if (savedRepo) {
    const opened = createWorkBranch(savedRepo, title);
    repoPath = savedRepo;
    branch = opened.branch;
    baseSha = opened.baseSha;
  } else if (!config.mockAgents) {
    throw new HttpError(400, "Enter a repo path. Kitchen Line needs a git repo to open a branch.");
  }

  const order: Order = {
    id: newId("ord"),
    title,
    acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : ["The change matches the order."],
    status: "placed",
    ticketBudgetUsd,
    mode: config.mockAgents ? "mock" : "anthropic",
    repoPath,
    branch,
    baseSha,
    testCommand,
    changedFiles: [],
    createdAt: Date.now(),
    servedAt: null,
  };
  db.insertOrder(order);
  publish({ type: "order", order });
  postEvent(order.id, null, "order.placed", `Order in: ${order.title}.`, {
    ticketBudgetUsd,
    acceptanceCriteria: order.acceptanceCriteria,
    mock: config.mockAgents,
    testCommand,
  });
  if (branch && repoPath) {
    postEvent(order.id, null, "order.branch", `Working on ${branch}. Cooks stay inside ${repoPath}.`, {
      branch,
      repoPath,
    });
  }
  return order;
}

export function markServed(orderId: string): Order {
  const order = mustOrder(orderId);
  if (order.status === "served") return order;
  const changedFiles =
    order.mode === "mock"
      ? []
      : listChangedFiles(order.repoPath ?? "", order.baseSha ?? "");
  const next: Order = {
    ...order,
    status: "served",
    servedAt: Date.now(),
    changedFiles,
  };
  db.saveOrder(next);
  publish({ type: "order", order: next });
  const message = next.branch
    ? `Served on ${next.branch}. Review with git diff, then merge if it looks good.`
    : "Served.";
  postEvent(order.id, null, "order.served", message, {
    branch: next.branch,
    changedFiles: next.changedFiles,
  });
  return next;
}

export function demoOrderInput(): PlaceOrderInput {
  return {
    title: "Add a payment section to the app",
    acceptanceCriteria: [
      "A payment section is added to the app",
      "Tests for the payment section exist and pass",
      "The change shows up as a real git diff",
    ],
    ticketBudgetUsd: 0.05,
  };
}

export function cancelOrder(orderId: string, reason: string): void {
  const order = db.getOrder(orderId);
  if (!order) return;
  if (order.status === "cancelled" || order.status === "served" || order.status === "ready") return;

  for (const ticket of db.listTickets(orderId)) {
    if (OPEN_TICKET.includes(ticket.status)) {
      setTicketStatus(ticket.id, "cancelled", {
        type: "ticket.cancelled",
        message: `${cookLabel(ticket.cookId)} stopped. ${reason}`,
      });
    }
  }

  setOrderStatus(orderId, "cancelled", {
    type: "order.cancelled",
    message: reason,
  });
}

export function recoverInterrupted(): void {
  for (const order of db.listOrders()) {
    if (order.status === "placed" || order.status === "cooking") {
      cancelOrder(order.id, "The server restarted before this order was finished.");
    }
  }
  for (const cook of db.listCooks()) {
    if (cook.status !== "idle" || cook.currentTicketId) {
      const idle: Cook = { ...cook, status: "idle", currentTicketId: null };
      db.saveCook(idle);
    }
  }
}

export function resetLine(): void {
  generation += 1;
  abortRuns();
  burners.clear();
  db.wipe();
  publish({ type: "snapshot", state: snapshot() });
}
