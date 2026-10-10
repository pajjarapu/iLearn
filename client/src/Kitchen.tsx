import {
  ORDER_STATUS_LABEL,
  STATION_LABEL,
  TICKET_STATUS_LABEL,
  type Cook,
  type OrderStatus,
  type Station,
  type Ticket,
} from "@kitchen/shared";
import { clock, money, ticketElapsed, ticketHeat } from "./format";
import { KitchenScene } from "./KitchenScene";

const FALLBACK: Cook[] = [
  { id: "alma", name: "Alma", station: "head_chef", role: "Splits the order", status: "idle", currentTicketId: null },
  { id: "jules", name: "Jules", station: "prep", role: "Research", status: "idle", currentTicketId: null },
  { id: "rio", name: "Rio", station: "grill", role: "Writes code", status: "idle", currentTicketId: null },
  { id: "nia", name: "Nia", station: "sauce", role: "Writes tests", status: "idle", currentTicketId: null },
];

export function KitchenView({
  cooks,
  tickets,
  orderTitle,
  orderStatus,
  branch,
  now,
  selectedId,
  onSelect,
}: {
  cooks: Cook[];
  tickets: Ticket[];
  orderTitle: string | null;
  orderStatus: OrderStatus | null;
  branch: string | null;
  now: number;
  selectedId: string | null;
  onSelect: (ticketId: string) => void;
}) {
  const line = cooks.length > 0 ? cooks : FALLBACK;
  const dishes = tickets.filter((ticket) => ticket.station !== "head_chef" && ticket.status === "ready_for_expo");
  const served = tickets.filter((ticket) => ticket.status === "served").length;

  return (
    <div className="scene">
      <div className="rail-wrap">
        <div className="rail-caption">
          <span>Order tickets</span>
          <strong>{orderTitle ?? "The line is clear"}</strong>
          {orderStatus && <em>{ORDER_STATUS_LABEL[orderStatus]}</em>}
          {branch && <code className="branch-name">{branch}</code>}
        </div>
        <div className="rail-bar" aria-hidden="true" />
        <div className="slips">
          {tickets.length === 0 && <p className="slip slip-empty">No tickets on the rail. Fire a demo order.</p>}
          {tickets.map((ticket, index) => {
            const heat = ticketHeat(ticket, now);
            const cook = line.find((item) => item.id === ticket.cookId);
            return (
              <button
                key={ticket.id}
                type="button"
                className={`slip slip-${heat.level} ${selectedId === ticket.id ? "selected" : ""}`}
                style={{ transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)` }}
                onClick={() => onSelect(ticket.id)}
                aria-pressed={selectedId === ticket.id}
              >
                <span className="slip-station">{STATION_LABEL[ticket.station]}</span>
                <strong>{cook?.name ?? "Cook"}</strong>
                <span className="slip-title">{ticket.title}</span>
                {branch && <span className="slip-branch">{branch}</span>}
                <span className="slip-cost">{money(ticket.costUsd)}</span>
                <span className="slip-meta">
                  <span>{ticket.startedAt ? clock(ticketElapsed(ticket, now)) : "Not started"}</span>
                  <span>{heat.label}</span>
                </span>
                <span className={`slip-status status-${heat.level}`}>{TICKET_STATUS_LABEL[ticket.status]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <KitchenScene
        cooks={line}
        readyCount={dishes.length}
        servedCount={served}
        onSelectStation={(station) => {
          const ticket = ticketFor(tickets, station);
          if (ticket) onSelect(ticket.id);
        }}
      />
    </div>
  );
}

function ticketFor(tickets: Ticket[], station: Station): Ticket | undefined {
  const mine = tickets.filter((ticket) => ticket.station === station);
  return (
    mine.find((ticket) => ticket.status === "working" || ticket.status === "waiting_burner") ??
    mine[mine.length - 1]
  );
}
