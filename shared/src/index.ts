export const STATIONS = ["head_chef", "prep", "grill", "sauce"] as const;

export type Station = (typeof STATIONS)[number];

export type OrderStatus = "placed" | "cooking" | "ready" | "served" | "cancelled";

export type TicketStatus =
  | "queued"
  | "working"
  | "waiting_burner"
  | "ready_for_expo"
  | "sent_back"
  | "paused"
  | "served"
  | "cancelled"
  | "done";

export type CookStatus = "idle" | "working" | "waiting" | "blocked";

export type OrderMode = "mock" | "anthropic";

export type Order = {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  status: OrderStatus;
  ticketBudgetUsd: number;
  mode: OrderMode;
  repoPath: string | null;
  branch: string | null;
  baseSha: string | null;
  testCommand: string;
  changedFiles: string[];
  createdAt: number;
  servedAt: number | null;
};

export type Ticket = {
  id: string;
  orderId: string;
  station: Station;
  cookId: string;
  title: string;
  detail: string;
  status: TicketStatus;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  budgetUsd: number;
  files: string[];
  startedAt: number | null;
  finishedAt: number | null;
  createdAt: number;
};

export type KitchenEvent = {
  id: number;
  orderId: string;
  ticketId: string | null;
  type: string;
  message: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

export type SendBack = {
  id: number;
  ticketId: string;
  reason: string;
  createdAt: number;
};

export type Cook = {
  id: string;
  name: string;
  station: Station;
  role: string;
  status: CookStatus;
  currentTicketId: string | null;
};

export type Pricing = {
  inputPerMtok: number;
  outputPerMtok: number;
};

export type WorkspaceSettings = {
  repoPath: string;
  testCommand: string;
  sandboxPath: string;
};

export type KitchenState = {
  orders: Order[];
  tickets: Ticket[];
  events: KitchenEvent[];
  sendBacks: SendBack[];
  cooks: Cook[];
  pricing: Pricing;
  mockAgents: boolean;
  workspace: WorkspaceSettings;
};

export type ServerMessage =
  | { type: "snapshot"; state: KitchenState }
  | { type: "event"; event: KitchenEvent }
  | { type: "ticket"; ticket: Ticket }
  | { type: "order"; order: Order }
  | { type: "cook"; cook: Cook };

export const DEFAULT_TEST_COMMAND = "npm test";

export type PlaceOrderInput = {
  title: string;
  acceptanceCriteria?: string[];
  ticketBudgetUsd?: number;
  repoPath?: string;
  testCommand?: string;
};

export type OrderDetail = {
  order: Order;
  tickets: Ticket[];
  events: KitchenEvent[];
  sendBacks: SendBack[];
};

export const STATION_LABEL: Record<Station, string> = {
  head_chef: "Head chef",
  prep: "Prep",
  grill: "Grill",
  sauce: "Sauce",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  queued: "Queued",
  working: "On the burner",
  waiting_burner: "Waiting for a burner",
  ready_for_expo: "At the expo window",
  sent_back: "Sent back",
  paused: "Paused",
  served: "Served",
  cancelled: "Cancelled",
  done: "Split done",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  cooking: "Cooking",
  ready: "Waiting on expo",
  served: "Served",
  cancelled: "Cancelled",
};

export const COOK_STATUS_LABEL: Record<CookStatus, string> = {
  idle: "Idle",
  working: "Working",
  waiting: "Waiting for a burner",
  blocked: "Blocked",
};
