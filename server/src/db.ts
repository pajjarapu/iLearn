import fs from "node:fs";
import path from "node:path";
import BetterSqlite from "better-sqlite3";
import {
  DEFAULT_TEST_COMMAND,
  type Cook,
  type CookStatus,
  type KitchenEvent,
  type Order,
  type OrderMode,
  type OrderStatus,
  type SendBack,
  type Station,
  type Ticket,
  type TicketStatus,
  type WorkspaceSettings,
} from "@kitchen/shared";
import { SANDBOX_LABEL } from "./workspace";
import { config } from "./config";

type OrderRow = {
  id: string;
  title: string;
  acceptance_criteria: string;
  status: string;
  ticket_budget_usd: number;
  mode: string;
  repo_path: string | null;
  branch: string | null;
  base_sha: string | null;
  test_command: string | null;
  changed_files: string | null;
  created_at: number;
  served_at: number | null;
};

type TicketRow = {
  id: string;
  order_id: string;
  station: string;
  cook_id: string;
  title: string;
  detail: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  budget_usd: number;
  files: string;
  started_at: number | null;
  finished_at: number | null;
  created_at: number;
};

type EventRow = {
  id: number;
  order_id: string;
  ticket_id: string | null;
  type: string;
  message: string;
  payload: string;
  created_at: number;
};

type SendBackRow = {
  id: number;
  ticket_id: string;
  reason: string;
  created_at: number;
};

type CookRow = {
  id: string;
  name: string;
  station: string;
  role: string;
  status: string;
  current_ticket_id: string | null;
};

const COOKS: Array<Omit<Cook, "status" | "currentTicketId">> = [
  { id: "alma", name: "Alma", station: "head_chef", role: "Splits the order" },
  { id: "jules", name: "Jules", station: "prep", role: "Research" },
  { id: "rio", name: "Rio", station: "grill", role: "Writes code" },
  { id: "nia", name: "Nia", station: "sauce", role: "Writes tests" },
];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,
  status TEXT NOT NULL,
  ticket_budget_usd REAL NOT NULL,
  mode TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  served_at INTEGER
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  station TEXT NOT NULL,
  cook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  status TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  budget_usd REAL NOT NULL,
  files TEXT NOT NULL DEFAULT '[]',
  started_at INTEGER,
  finished_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  ticket_id TEXT REFERENCES tickets(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS send_backs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  station TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  current_ticket_id TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_events_order ON events(order_id);
CREATE INDEX IF NOT EXISTS idx_send_backs_ticket ON send_backs(ticket_id);
`;

let database: BetterSqlite.Database | null = null;

function requireDb(): BetterSqlite.Database {
  if (!database) throw new Error("Database is not open.");
  return database;
}

function parseObject(text: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    // Fall through to an empty payload.
  }
  return {};
}

function parseStringArray(text: string): string[] {
  try {
    const value: unknown = JSON.parse(text);
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  } catch {
    // Fall through to an empty list.
  }
  return [];
}

function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id,
    title: row.title,
    acceptanceCriteria: parseStringArray(row.acceptance_criteria),
    status: row.status as OrderStatus,
    ticketBudgetUsd: row.ticket_budget_usd,
    mode: row.mode as OrderMode,
    repoPath: row.repo_path,
    branch: row.branch,
    baseSha: row.base_sha,
    testCommand: row.test_command || DEFAULT_TEST_COMMAND,
    changedFiles: parseStringArray(row.changed_files ?? "[]"),
    createdAt: row.created_at,
    servedAt: row.served_at,
  };
}

function ticketFromRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    orderId: row.order_id,
    station: row.station as Station,
    cookId: row.cook_id,
    title: row.title,
    detail: row.detail,
    status: row.status as TicketStatus,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costUsd: row.cost_usd,
    budgetUsd: row.budget_usd,
    files: parseStringArray(row.files),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

function eventFromRow(row: EventRow): KitchenEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    ticketId: row.ticket_id,
    type: row.type,
    message: row.message,
    payload: parseObject(row.payload),
    createdAt: row.created_at,
  };
}

function sendBackFromRow(row: SendBackRow): SendBack {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function cookFromRow(row: CookRow): Cook {
  return {
    id: row.id,
    name: row.name,
    station: row.station as Station,
    role: row.role,
    status: row.status as CookStatus,
    currentTicketId: row.current_ticket_id,
  };
}

function seedCooks(connection: BetterSqlite.Database): void {
  const stmt = connection.prepare(`
    INSERT INTO cooks (id, name, station, role, status, current_ticket_id)
    VALUES (@id, @name, @station, @role, 'idle', NULL)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      station = excluded.station,
      role = excluded.role
  `);
  const seed = connection.transaction(() => {
    for (const cook of COOKS) stmt.run(cook);
  });
  seed();
}

function ensureColumn(connection: BetterSqlite.Database, table: string, column: string, definition: string): void {
  const columns = connection.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((item) => item.name === column)) return;
  connection.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

export function initDb(): void {
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  database = new BetterSqlite(config.databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(SCHEMA);
  ensureColumn(database, "orders", "repo_path", "repo_path TEXT");
  ensureColumn(database, "orders", "branch", "branch TEXT");
  ensureColumn(database, "orders", "base_sha", "base_sha TEXT");
  ensureColumn(database, "orders", "test_command", "test_command TEXT");
  ensureColumn(database, "orders", "changed_files", "changed_files TEXT NOT NULL DEFAULT '[]'");
  seedCooks(database);
}

export function closeDb(): void {
  database?.close();
  database = null;
}

export function runTransaction<T>(fn: () => T): T {
  return requireDb().transaction(fn)();
}

export function wipe(): void {
  const connection = requireDb();
  connection.transaction(() => {
    connection.exec(`
      DELETE FROM send_backs;
      DELETE FROM events;
      DELETE FROM tickets;
      DELETE FROM orders;
      UPDATE cooks SET status = 'idle', current_ticket_id = NULL;
    `);
  })();
}

export function listOrders(): Order[] {
  const rows = requireDb().prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as OrderRow[];
  return rows.map(orderFromRow);
}

export function getOrder(id: string): Order | null {
  const row = requireDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  return row ? orderFromRow(row) : null;
}

export function insertOrder(order: Order): Order {
  requireDb()
    .prepare(
      `INSERT INTO orders (
        id, title, acceptance_criteria, status, ticket_budget_usd, mode,
        repo_path, branch, base_sha, test_command, changed_files, created_at, served_at
      ) VALUES (
        @id, @title, @acceptance_criteria, @status, @ticket_budget_usd, @mode,
        @repo_path, @branch, @base_sha, @test_command, @changed_files, @created_at, @served_at
      )`,
    )
    .run({
      id: order.id,
      title: order.title,
      acceptance_criteria: JSON.stringify(order.acceptanceCriteria),
      status: order.status,
      ticket_budget_usd: order.ticketBudgetUsd,
      mode: order.mode,
      repo_path: order.repoPath,
      branch: order.branch,
      base_sha: order.baseSha,
      test_command: order.testCommand,
      changed_files: JSON.stringify(order.changedFiles),
      created_at: order.createdAt,
      served_at: order.servedAt,
    });
  return order;
}

export function saveOrder(order: Order): void {
  const info = requireDb()
    .prepare(
      `UPDATE orders SET
        title = @title,
        acceptance_criteria = @acceptance_criteria,
        status = @status,
        ticket_budget_usd = @ticket_budget_usd,
        mode = @mode,
        repo_path = @repo_path,
        branch = @branch,
        base_sha = @base_sha,
        test_command = @test_command,
        changed_files = @changed_files,
        served_at = @served_at
      WHERE id = @id`,
    )
    .run({
      id: order.id,
      title: order.title,
      acceptance_criteria: JSON.stringify(order.acceptanceCriteria),
      status: order.status,
      ticket_budget_usd: order.ticketBudgetUsd,
      mode: order.mode,
      repo_path: order.repoPath,
      branch: order.branch,
      base_sha: order.baseSha,
      test_command: order.testCommand,
      changed_files: JSON.stringify(order.changedFiles),
      served_at: order.servedAt,
    });
  if (info.changes !== 1) throw new Error(`Order ${order.id} was not saved.`);
}

export function listTickets(orderId?: string): Ticket[] {
  const rows = orderId
    ? (requireDb()
        .prepare("SELECT * FROM tickets WHERE order_id = ? ORDER BY created_at ASC")
        .all(orderId) as TicketRow[])
    : (requireDb().prepare("SELECT * FROM tickets ORDER BY created_at ASC").all() as TicketRow[]);
  return rows.map(ticketFromRow);
}

export function getTicket(id: string): Ticket | null {
  const row = requireDb().prepare("SELECT * FROM tickets WHERE id = ?").get(id) as TicketRow | undefined;
  return row ? ticketFromRow(row) : null;
}

export function insertTicket(ticket: Ticket): Ticket {
  requireDb()
    .prepare(
      `INSERT INTO tickets (
        id, order_id, station, cook_id, title, detail, status,
        input_tokens, output_tokens, cost_usd, budget_usd, files,
        started_at, finished_at, created_at
      ) VALUES (
        @id, @order_id, @station, @cook_id, @title, @detail, @status,
        @input_tokens, @output_tokens, @cost_usd, @budget_usd, @files,
        @started_at, @finished_at, @created_at
      )`,
    )
    .run({
      id: ticket.id,
      order_id: ticket.orderId,
      station: ticket.station,
      cook_id: ticket.cookId,
      title: ticket.title,
      detail: ticket.detail,
      status: ticket.status,
      input_tokens: ticket.inputTokens,
      output_tokens: ticket.outputTokens,
      cost_usd: ticket.costUsd,
      budget_usd: ticket.budgetUsd,
      files: JSON.stringify(ticket.files),
      started_at: ticket.startedAt,
      finished_at: ticket.finishedAt,
      created_at: ticket.createdAt,
    });
  return ticket;
}

export function saveTicket(ticket: Ticket): void {
  const info = requireDb()
    .prepare(
      `UPDATE tickets SET
        station = @station,
        cook_id = @cook_id,
        title = @title,
        detail = @detail,
        status = @status,
        input_tokens = @input_tokens,
        output_tokens = @output_tokens,
        cost_usd = @cost_usd,
        budget_usd = @budget_usd,
        files = @files,
        started_at = @started_at,
        finished_at = @finished_at
      WHERE id = @id`,
    )
    .run({
      id: ticket.id,
      station: ticket.station,
      cook_id: ticket.cookId,
      title: ticket.title,
      detail: ticket.detail,
      status: ticket.status,
      input_tokens: ticket.inputTokens,
      output_tokens: ticket.outputTokens,
      cost_usd: ticket.costUsd,
      budget_usd: ticket.budgetUsd,
      files: JSON.stringify(ticket.files),
      started_at: ticket.startedAt,
      finished_at: ticket.finishedAt,
    });
  if (info.changes !== 1) throw new Error(`Ticket ${ticket.id} was not saved.`);
}

export function insertEvent(event: Omit<KitchenEvent, "id">): KitchenEvent {
  const info = requireDb()
    .prepare(
      `INSERT INTO events (order_id, ticket_id, type, message, payload, created_at)
       VALUES (@order_id, @ticket_id, @type, @message, @payload, @created_at)`,
    )
    .run({
      order_id: event.orderId,
      ticket_id: event.ticketId,
      type: event.type,
      message: event.message,
      payload: JSON.stringify(event.payload),
      created_at: event.createdAt,
    });
  return { ...event, id: Number(info.lastInsertRowid) };
}

export function listEvents(limit = 300): KitchenEvent[] {
  const rows = requireDb()
    .prepare(
      `SELECT * FROM (
         SELECT * FROM events ORDER BY id DESC LIMIT ?
       ) ORDER BY id ASC`,
    )
    .all(limit) as EventRow[];
  return rows.map(eventFromRow);
}

export function listEventsForOrder(orderId: string): KitchenEvent[] {
  const rows = requireDb()
    .prepare("SELECT * FROM events WHERE order_id = ? ORDER BY id ASC")
    .all(orderId) as EventRow[];
  return rows.map(eventFromRow);
}

export function listSendBacks(): SendBack[] {
  const rows = requireDb()
    .prepare("SELECT * FROM send_backs ORDER BY id ASC")
    .all() as SendBackRow[];
  return rows.map(sendBackFromRow);
}

export function listCooks(): Cook[] {
  const rows = requireDb().prepare("SELECT * FROM cooks").all() as CookRow[];
  return rows.map(cookFromRow);
}

export function getCook(id: string): Cook | null {
  const row = requireDb().prepare("SELECT * FROM cooks WHERE id = ?").get(id) as CookRow | undefined;
  return row ? cookFromRow(row) : null;
}

export function getSetting(key: string): string | null {
  const row = requireDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  requireDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function workspaceSettings(): WorkspaceSettings {
  return {
    repoPath: getSetting("repoPath") ?? "",
    testCommand: getSetting("testCommand") || DEFAULT_TEST_COMMAND,
    sandboxPath: SANDBOX_LABEL,
  };
}

export function saveCook(cook: Cook): void {
  const info = requireDb()
    .prepare(
      `UPDATE cooks SET
        name = @name,
        station = @station,
        role = @role,
        status = @status,
        current_ticket_id = @current_ticket_id
      WHERE id = @id`,
    )
    .run({
      id: cook.id,
      name: cook.name,
      station: cook.station,
      role: cook.role,
      status: cook.status,
      current_ticket_id: cook.currentTicketId,
    });
  if (info.changes !== 1) throw new Error(`Cook ${cook.id} was not saved.`);
}
