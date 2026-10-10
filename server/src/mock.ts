import type { Order, Ticket } from "@kitchen/shared";
import { burners } from "./burners";
import { readWorkFile, writeWorkFile } from "./workspace";
import * as db from "./db";
import { AbortError, isAbort } from "./errors";
import {
  cancelOrder,
  cookForStation,
  cookLabel,
  getTicket,
  lineGeneration,
  openTicket,
  postEvent,
  recordUsage,
  registerRun,
  setOrderStatus,
  setTicketStatus,
  touchFile,
  unregisterRun,
} from "./line";

const SLICE_MS = 250;

type KitchenFiles = {
  research: string;
  component: string;
  logic: string;
  test: string;
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new AbortError());
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function checkpoint(gen: number, signal: AbortSignal): void {
  if (signal.aborted || gen !== lineGeneration()) throw new AbortError();
}

function splitCount(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const extra = total - base * parts;
  return Array.from({ length: parts }, (_, index) => base + (index < extra ? 1 : 0));
}

async function note(ticket: Ticket, message: string, gen: number, signal: AbortSignal): Promise<void> {
  checkpoint(gen, signal);
  postEvent(ticket.orderId, ticket.id, "station.note", message);
}

async function drip(
  ticket: Ticket,
  input: number,
  output: number,
  signal: AbortSignal,
  gen: number,
): Promise<void> {
  const inputs = splitCount(input, 3);
  const outputs = splitCount(output, 3);
  for (let index = 0; index < inputs.length; index += 1) {
    await sleep(SLICE_MS, signal);
    checkpoint(gen, signal);
    recordUsage(ticket.id, inputs[index] ?? 0, outputs[index] ?? 0);
  }
}

function holderText(file: string): string {
  const holderId = burners.holder(file);
  if (!holderId) return "It is about to free up.";
  const holder = getTicket(holderId);
  if (!holder) return "Another cook has it.";
  return `${cookLabel(holder.cookId)} has it.`;
}

async function holdFile(ticket: Ticket, file: string, signal: AbortSignal, gen: number): Promise<void> {
  const name = cookLabel(ticket.cookId);

  if (burners.claim(file, ticket.id)) {
    try {
      checkpoint(gen, signal);
      touchFile(ticket.id, file);
      postEvent(ticket.orderId, ticket.id, "file.claimed", `${name} claimed burner ${file}.`, { file });
    } catch (error) {
      burners.release(file, ticket.id);
      throw error;
    }
    return;
  }

  checkpoint(gen, signal);
  setTicketStatus(ticket.id, "waiting_burner", {
    type: "file.waiting",
    message: `${name} is waiting for burner ${file}. ${holderText(file)}`,
    payload: { file },
  });

  while (!burners.claim(file, ticket.id)) {
    await sleep(200, signal);
    checkpoint(gen, signal);
  }

  try {
    checkpoint(gen, signal);
    touchFile(ticket.id, file);
    setTicketStatus(ticket.id, "working", {
      type: "file.claimed",
      message: `${name} claimed burner ${file}.`,
      payload: { file },
    });
  } catch (error) {
    burners.release(file, ticket.id);
    throw error;
  }
}

function releaseFile(ticket: Ticket, file: string, gen: number): void {
  burners.release(file, ticket.id);
  if (gen !== lineGeneration()) return;
  postEvent(ticket.orderId, ticket.id, "file.released", `${cookLabel(ticket.cookId)} cleared burner ${file}.`, {
    file,
  });
}

function land(order: Order, ticket: Ticket, file: string, body: string): void {
  if (!order.repoPath) return;
  writeWorkFile(order.repoPath, file, body);
  postEvent(order.id, ticket.id, "file.wrote", `${cookLabel(ticket.cookId)} wrote ${file} in the repo.`, { file });
}

function wireCounter(order: Order, ticket: Ticket): void {
  if (!order.repoPath) return;
  let page = "";
  try {
    page = readWorkFile(order.repoPath, "index.html");
  } catch {
    return;
  }
  const next = page.replace(
    '<p id="pay">Payment is not wired up yet.</p>',
    `<form id="pay">
    <h2>Pay the tab</h2>
    <label>Card <input name="card" placeholder="4242 4242 4242 4242" /></label>
    <button type="submit">Charge</button>
  </form>`,
  );
  if (next === page) return;
  writeWorkFile(order.repoPath, "index.html", next);
  postEvent(order.id, ticket.id, "file.wrote", `${cookLabel(ticket.cookId)} added the payment form to index.html.`, {
    file: "index.html",
  });
}

function filesFor(title: string): KitchenFiles {
  if (/payment/i.test(title)) {
    return {
      research: "notes/payment-research.md",
      component: "src/app/PaymentSection.tsx",
      logic: "src/app/checkout.ts",
      test: "tests/payment.test.ts",
    };
  }
  return {
    research: "notes/research.md",
    component: "src/app/Feature.tsx",
    logic: "src/app/feature.ts",
    test: "tests/feature.test.ts",
  };
}

async function runHead(ticket: Ticket, order: Order, signal: AbortSignal, gen: number): Promise<void> {
  const name = cookLabel(ticket.cookId);
  setTicketStatus(ticket.id, "working", {
    type: "cook.working",
    message: `${name} is reading the order.`,
  });
  await note(ticket, `${name} is reading the order and the acceptance criteria.`, gen, signal);
  await drip(ticket, 1200, 350, signal, gen);
  await note(ticket, `${name} split "${order.title}" into prep, grill, and sauce.`, gen, signal);
  await drip(ticket, 600, 250, signal, gen);
  setTicketStatus(ticket.id, "done", {
    type: "ticket.ready",
    message: `${name} finished the split. The stations can start.`,
  });
}

async function runPrep(ticket: Ticket, order: Order, files: KitchenFiles, signal: AbortSignal, gen: number): Promise<void> {
  const held: string[] = [];
  const name = cookLabel(ticket.cookId);
  try {
    setTicketStatus(ticket.id, "working", {
      type: "cook.working",
      message: `${name} started research.`,
    });
    await note(ticket, `${name} is looking through the repo.`, gen, signal);
    await holdFile(ticket, files.research, signal, gen);
    held.push(files.research);
    await drip(ticket, 1500, 350, signal, gen);
    await note(ticket, `${name} wrote up what the grill cook needs.`, gen, signal);
    land(
      order,
      ticket,
      files.research,
      `# Payment research\n\nThe counter lists coffee, a sandwich, and a cookie.\nindex.html still says payment is not wired up.\nGrill should add a card form and a charge function.\n`,
    );
    await drip(ticket, 1500, 350, signal, gen);
    setTicketStatus(ticket.id, "ready_for_expo", {
      type: "ticket.ready",
      message: `${name} plated the research. It is waiting at expo.`,
    });
  } finally {
    for (const file of held) releaseFile(ticket, file, gen);
  }
}

async function runGrill(ticket: Ticket, order: Order, files: KitchenFiles, signal: AbortSignal, gen: number): Promise<void> {
  const held: string[] = [];
  const name = cookLabel(ticket.cookId);
  try {
    setTicketStatus(ticket.id, "working", {
      type: "cook.working",
      message: `${name} started writing code.`,
    });
    await holdFile(ticket, files.component, signal, gen);
    held.push(files.component);
    await holdFile(ticket, files.logic, signal, gen);
    held.push(files.logic);
    await note(ticket, `${name} is drafting the change.`, gen, signal);
    await drip(ticket, 2500, 700, signal, gen);
    land(
      order,
      ticket,
      files.component,
      `export function PaymentSection() {\n  return (\n    <form>\n      <h2>Pay the tab</h2>\n      <label>\n        Card\n        <input name="card" placeholder="4242 4242 4242 4242" />\n      </label>\n      <button type="submit">Charge</button>\n    </form>\n  );\n}\n`,
    );
    wireCounter(order, ticket);
    await note(ticket, `${name} is wiring the logic and reading the same files again.`, gen, signal);
    await drip(ticket, 2500, 700, signal, gen);
    land(
      order,
      ticket,
      files.logic,
      `export function charge(amount: number): number {\n  const serviceFee = 1;\n  return amount + serviceFee;\n}\n`,
    );
    await drip(ticket, 1500, 400, signal, gen);
    setTicketStatus(ticket.id, "ready_for_expo", {
      type: "ticket.ready",
      message: `${name} plated the code. It is waiting at expo.`,
    });
  } finally {
    for (const file of held) releaseFile(ticket, file, gen);
  }
}

async function runSauce(ticket: Ticket, order: Order, files: KitchenFiles, signal: AbortSignal, gen: number): Promise<void> {
  const held: string[] = [];
  const name = cookLabel(ticket.cookId);
  try {
    setTicketStatus(ticket.id, "working", {
      type: "cook.working",
      message: `${name} started the tests.`,
    });
    await note(ticket, `${name} is writing the first tests.`, gen, signal);
    await holdFile(ticket, files.test, signal, gen);
    held.push(files.test);
    await drip(ticket, 2000, 600, signal, gen);
    land(
      order,
      ticket,
      files.test,
      `import assert from "node:assert/strict";\nimport test from "node:test";\nimport { charge } from "../src/app/checkout.ts";\n\ntest("charges the tab with no surprise fee", () => {\n  assert.equal(charge(10), 10);\n});\n`,
    );
    await note(ticket, `${name} needs ${files.logic} to check the change.`, gen, signal);
    await holdFile(ticket, files.logic, signal, gen);
    held.push(files.logic);
    await note(ticket, `Tests failed on the first run. ${name} is running them again.`, gen, signal);
    await drip(ticket, 3500, 900, signal, gen);
    await note(ticket, `Same failure. ${name} is running the suite again.`, gen, signal);
    await drip(ticket, 3500, 900, signal, gen);
    await note(ticket, `Third run, same failure. ${name} is still on the burner.`, gen, signal);
    await drip(ticket, 3500, 900, signal, gen);
    setTicketStatus(ticket.id, "ready_for_expo", {
      type: "ticket.ready",
      message: `${name} sent the dish to expo. The tests never passed. Expo has not checked it yet.`,
    });
  } finally {
    for (const file of held) releaseFile(ticket, file, gen);
  }
}

export async function runMockOrder(orderId: string): Promise<void> {
  const gen = lineGeneration();
  const controller = new AbortController();
  registerRun(orderId, controller);
  const { signal } = controller;

  try {
    checkpoint(gen, signal);
    const order = db.getOrder(orderId);
    if (!order) return;

    setOrderStatus(orderId, "cooking", {
      type: "order.cooking",
      message: "Alma is running the line.",
    });

    const head = openTicket({
      orderId,
      station: "head_chef",
      cook: cookForStation("head_chef"),
      title: "Split the order",
      detail: order.acceptanceCriteria.join(" "),
      budgetUsd: order.ticketBudgetUsd,
    });
    await runHead(head, order, signal, gen);

    const files = filesFor(order.title);
    const prep = openTicket({
      orderId,
      station: "prep",
      cook: cookForStation("prep"),
      title: "Research the order",
      detail: `Look through the repo for anything that bears on: ${order.title}`,
      budgetUsd: order.ticketBudgetUsd,
    });
    const grill = openTicket({
      orderId,
      station: "grill",
      cook: cookForStation("grill"),
      title: "Write the code",
      detail: `Implement: ${order.title}`,
      budgetUsd: order.ticketBudgetUsd,
    });
    const sauce = openTicket({
      orderId,
      station: "sauce",
      cook: cookForStation("sauce"),
      title: "Test the change",
      detail: `Write tests for: ${order.title}`,
      budgetUsd: order.ticketBudgetUsd,
    });

    await Promise.all([
      runPrep(prep, order, files, signal, gen),
      runGrill(grill, order, files, signal, gen),
      runSauce(sauce, order, files, signal, gen),
    ]);

    checkpoint(gen, signal);
    setOrderStatus(orderId, "ready", {
      type: "order.ready",
      message: "All three stations are at the expo window. Nothing is served until expo passes.",
    });
  } catch (error) {
    controller.abort();
    if (gen !== lineGeneration()) return;
    if (isAbort(error)) {
      cancelOrder(orderId, "The order was cancelled.");
      return;
    }
    console.error("[kitchen] mock order failed", error);
    cancelOrder(orderId, error instanceof Error ? error.message : "The line stopped.");
  } finally {
    unregisterRun(orderId);
  }
}
