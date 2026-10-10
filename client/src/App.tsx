import { useEffect, useState, type FormEvent } from "react";
import {
  DEFAULT_TEST_COMMAND,
  STATION_LABEL,
  TICKET_STATUS_LABEL,
  type Cook,
  type Order,
  type Station,
  type Ticket,
} from "@kitchen/shared";
import { clock, cookTotals, money, stamp, ticketElapsed, ticketHeat, tokens } from "./format";
import { KitchenView } from "./Kitchen";
import { useKitchen } from "./useKitchen";

const STATION_RANK: Record<Station, number> = {
  head_chef: 0,
  prep: 1,
  grill: 2,
  sauce: 3,
};

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function App() {
  const { state, link } = useKitchen();
  const now = useNow();
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [budget, setBudget] = useState("0.25");
  const [repoPath, setRepoPath] = useState("");
  const [testCommand, setTestCommand] = useState(DEFAULT_TEST_COMMAND);
  const [repoNote, setRepoNote] = useState("");
  const [repoOk, setRepoOk] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"demo" | "order" | "reset" | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cooking = state?.orders.some((order) => order.status === "placed" || order.status === "cooking") ?? false;
  const focus = focusOrder(state?.orders ?? []);
  const tickets = (state?.tickets ?? [])
    .filter((ticket) => (focus ? ticket.orderId === focus.id : false))
    .slice()
    .sort((a, b) => STATION_RANK[a.station] - STATION_RANK[b.station]);
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const ranked = state ? cookTotals(state.tickets, state.cooks) : [];
  const leader = ranked.find((row) => row.cost > 0) ?? null;

  useEffect(() => {
    if (!state || workspaceReady) return;
    setRepoPath(state.workspace.repoPath);
    setTestCommand(state.workspace.testCommand || DEFAULT_TEST_COMMAND);
    setRepoOk(Boolean(state.workspace.repoPath));
    setRepoNote(state.workspace.repoPath ? "Saved git repo." : "");
    setWorkspaceReady(true);
  }, [state, workspaceReady]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (selectedId && !tickets.some((ticket) => ticket.id === selectedId)) setSelectedId(null);
  }, [selectedId, tickets]);

  async function post(path: string, body?: unknown): Promise<void> {
    const response = await fetch(path, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "The line did not take that order.");
    }
  }

  async function placeDemo() {
    setPending("demo");
    setError("");
    setSelectedId(null);
    try {
      await post("/api/demo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The demo order failed.");
    } finally {
      setPending(null);
    }
  }

  async function placeCustom(event: FormEvent) {
    event.preventDefault();
    setPending("order");
    setError("");
    try {
      await post("/api/orders", {
        title,
        acceptanceCriteria: criteria.split("\n"),
        ticketBudgetUsd: Number(budget),
        repoPath,
        testCommand,
      });
      setTitle("");
      setCriteria("");
      setOrderOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The order failed.");
    } finally {
      setPending(null);
    }
  }

  async function saveWorkspace(nextPath = repoPath, nextCommand = testCommand) {
    const response = await fetch("/api/workspace", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoPath: nextPath, testCommand: nextCommand }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      workspace?: { repoPath: string; testCommand: string };
    } | null;
    if (!response.ok || !payload?.workspace) {
      setRepoOk(false);
      setRepoNote(payload?.error ?? "That folder is not a git repo.");
      return;
    }
    setRepoPath(payload.workspace.repoPath);
    setTestCommand(payload.workspace.testCommand);
    setRepoOk(Boolean(payload.workspace.repoPath));
    setRepoNote(payload.workspace.repoPath ? "Saved git repo." : "");
  }

  async function clearLine() {
    if (!window.confirm("Clear every ticket on the line?")) return;
    setPending("reset");
    setError("");
    setSelectedId(null);
    try {
      await post("/api/reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear the line.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="kitchen-app">
      <header className="bar">
        <h1 className="brand">Kitchen Line</h1>
        <div className="bar-actions">
          <button type="button" className="primary" onClick={placeDemo} disabled={pending !== null || cooking}>
            {pending === "demo" ? "Firing…" : "Fire the demo ticket"}
          </button>
          <button type="button" onClick={() => setOrderOpen((open) => !open)} disabled={cooking}>
            Write an order
          </button>
          <button type="button" className="ghost" onClick={clearLine} disabled={pending !== null}>
            {pending === "reset" ? "Clearing…" : "Clear the line"}
          </button>
        </div>
        <div className="bar-side">
          {leader && (
            <p className="chalk">
              <span>Most expensive</span>
              <strong>
                {leader.cook.name} {money(leader.cost)}
              </strong>
            </p>
          )}
          <p className={link === "live" ? "pill live" : "pill"}>
            {link === "live" ? "Live" : link === "connecting" ? "Connecting" : "Reconnecting"}
          </p>
        </div>
      </header>

      {state?.mockAgents && state.workspace.repoPath && (
        <p className="banner">
          Cooks are writing this order on a new branch in {state.workspace.repoPath}. Token counts are still simulated.
        </p>
      )}
      {state?.mockAgents && !state.workspace.repoPath && (
        <p className="banner">
          Simulated cooks stay in /sandbox and do not touch git. The dollar tags use the price table. No API call is
          being billed.
        </p>
      )}
      {state && !state.mockAgents && (
        <p className="banner">
          Real mode opens a branch in your repo and keeps every file edit inside it. Model calls are not connected yet.
        </p>
      )}
      {error && <p className="toast">{error}</p>}

      <form
        className="workspace"
        onSubmit={(event) => {
          event.preventDefault();
          void saveWorkspace().catch((err: unknown) => {
            setRepoOk(false);
            setRepoNote(err instanceof Error ? err.message : "Could not save the repo path.");
          });
        }}
      >
        <label>
          Repo path
          <input
            value={repoPath}
            onChange={(event) => {
              setRepoPath(event.target.value);
              setRepoOk(false);
            }}
            onBlur={() => {
              void saveWorkspace().catch((err: unknown) => {
                setRepoOk(false);
                setRepoNote(err instanceof Error ? err.message : "Could not save the repo path.");
              });
            }}
            placeholder="/Users/you/project"
            spellCheck={false}
          />
        </label>
        <label>
          Test command
          <input
            value={testCommand}
            onChange={(event) => setTestCommand(event.target.value)}
            onBlur={() => {
              void saveWorkspace().catch((err: unknown) => {
                setRepoNote(err instanceof Error ? err.message : "Could not save the test command.");
              });
            }}
            placeholder={DEFAULT_TEST_COMMAND}
            spellCheck={false}
          />
        </label>
        <p className={repoOk ? "workspace-note ok" : "workspace-note"} role="status">
          {repoNote ||
            (state?.mockAgents
              ? "Mock orders ignore this path and stay in /sandbox."
              : state
                ? "Point this at a git repo."
                : "")}
        </p>
      </form>

      {orderOpen && (
        <form className="order-form" onSubmit={placeCustom}>
          <label>
            Order
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a payment section to the app"
              maxLength={300}
            />
          </label>
          <label>
            Acceptance criteria
            <textarea
              value={criteria}
              onChange={(event) => setCriteria(event.target.value)}
              placeholder={"One criterion per line"}
              rows={3}
            />
          </label>
          <label>
            Budget per ticket
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={pending !== null || cooking}>
            {pending === "order" ? "Sending…" : "Place order"}
          </button>
        </form>
      )}

      {focus?.status === "served" && focus.mode === "anthropic" && (
        <section className="plated">
          <p className="kicker">Served</p>
          <h2>Branch {focus.branch}</h2>
          {focus.changedFiles.length === 0 ? (
            <p>No files changed.</p>
          ) : (
            <ul>
              {focus.changedFiles.map((file) => (
                <li key={file}>
                  <code>{file}</code>
                </li>
              ))}
            </ul>
          )}
          <p>Review with git diff, then merge if it looks good.</p>
        </section>
      )}

      <KitchenView
        cooks={state?.cooks ?? []}
        tickets={tickets}
        orderTitle={focus?.title ?? null}
        orderStatus={focus?.status ?? null}
        branch={focus?.branch ?? null}
        now={now}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selected && state && (
        <TicketPanel
          ticket={selected}
          cookName={cookName(state.cooks, selected.cookId)}
          branch={focus?.branch ?? null}
          now={now}
          events={state.events.filter((event) => event.ticketId === selected.id)}
          inputRate={state.pricing.inputPerMtok}
          outputRate={state.pricing.outputPerMtok}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function TicketPanel({
  ticket,
  cookName: name,
  branch,
  now,
  events,
  inputRate,
  outputRate,
  onClose,
}: {
  ticket: Ticket;
  cookName: string;
  branch: string | null;
  now: number;
  events: { id: number; type: string; message: string; createdAt: number }[];
  inputRate: number;
  outputRate: number;
  onClose: () => void;
}) {
  const heat = ticketHeat(ticket, now);
  const inputCost = (ticket.inputTokens / 1_000_000) * inputRate;
  const outputCost = (ticket.outputTokens / 1_000_000) * outputRate;
  return (
    <aside className="drawer">
      <button type="button" className="ghost close" onClick={onClose}>
        Close
      </button>
      <p className="kicker">{STATION_LABEL[ticket.station]}</p>
      <h2>
        {name} · {ticket.title}
      </h2>
      {branch && <p className="fine">Branch {branch}</p>}
      <p className={`status status-${heat.level}`}>{TICKET_STATUS_LABEL[ticket.status]}</p>
      <p className={`heat-label status-${heat.level}`}>{heat.label}</p>
      <p className="drawer-cost">{money(ticket.costUsd)}</p>
      <p className="fine">
        {ticket.startedAt ? clock(ticketElapsed(ticket, now)) : "Not started"} · budget {money(ticket.budgetUsd)}
      </p>
      <h3>Cost breakdown</h3>
      <ul className="breakdown">
        <li>
          <span>{tokens(ticket.inputTokens)} input tokens</span>
          <strong>{money(inputCost)}</strong>
        </li>
        <li>
          <span>{tokens(ticket.outputTokens)} output tokens</span>
          <strong>{money(outputCost)}</strong>
        </li>
      </ul>
      <h3>Files touched</h3>
      {ticket.files.length === 0 ? (
        <p className="fine">No burners claimed yet.</p>
      ) : (
        <ul className="files">
          {ticket.files.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      )}
      <h3>Event log</h3>
      <div className="tape">
        {events.length === 0 && <p className="fine">No events yet.</p>}
        {events.map((event) => (
          <p key={event.id} className={tapeClass(event.type)}>
            <time>{stamp(event.createdAt)}</time>
            {event.message}
          </p>
        ))}
      </div>
    </aside>
  );
}

function focusOrder(orders: Order[]): Order | undefined {
  return (
    orders.find((order) => order.status === "cooking" || order.status === "placed") ??
    orders.slice().sort((a, b) => b.createdAt - a.createdAt)[0]
  );
}

function cookName(cooks: Cook[], cookId: string): string {
  return cooks.find((cook) => cook.id === cookId)?.name ?? cookId;
}

function tapeClass(type: string): string {
  if (type === "budget.exceeded") return "tape-row hot";
  if (type === "budget.warning" || type === "file.waiting") return "tape-row warm";
  return "tape-row";
}
