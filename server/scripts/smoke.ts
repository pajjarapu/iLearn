import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { OrderDetail, ServerMessage, Ticket } from "@kitchen/shared";

const dbPath = path.join(os.tmpdir(), `kitchen-line-${process.pid}.db`);
process.env.DATABASE_PATH = dbPath;
process.env.MOCK_AGENTS = "true";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const { startServer } = await import("../src/server");
  const { costUsd } = await import("../src/pricing");
  const { WebSocket } = await import("ws");

  const started = await startServer(0);
  const base = `http://127.0.0.1:${started.port}`;
  const messages: ServerMessage[] = [];
  const socket = new WebSocket(`ws://127.0.0.1:${started.port}/line`);

  socket.on("message", (data) => {
    messages.push(JSON.parse(data.toString()) as ServerMessage);
  });

  try {
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });

  const created = await fetch(`${base}/api/demo`, { method: "POST" });
  const createdBody = (await created.json()) as { order?: { id: string }; error?: string };
  assert(created.status === 201, `demo failed: ${created.status} ${createdBody.error ?? ""}`);
  const orderId = createdBody.order?.id;
  assert(orderId, "demo response missing order id");

  const detail = await waitForReady(base, orderId);
  assert(detail.order.status === "ready", `expected ready, got ${detail.order.status}`);
  assert(detail.order.mode === "mock", "order should be marked mock");
  assert(detail.order.branch === null, "mock mode should not open a git branch");
  assert(detail.order.repoPath === null, "mock mode should not record a repo path");
  assert(detail.sendBacks.length === 0, "phase 1 should not write send-backs");

  const byStation = Object.fromEntries(detail.tickets.map((ticket) => [ticket.station, ticket]));
  const head = byStation.head_chef;
  const prep = byStation.prep;
  const grill = byStation.grill;
  const sauce = byStation.sauce;
  assert(head && prep && grill && sauce, "expected head, prep, grill, and sauce tickets");

  assert(head.status === "done", `head status ${head.status}`);
  assert(prep.status === "ready_for_expo", `prep status ${prep.status}`);
  assert(grill.status === "ready_for_expo", `grill status ${grill.status}`);
  assert(sauce.status === "ready_for_expo", `sauce status ${sauce.status}`);
  assert(detail.tickets.every((ticket) => ticket.status !== "served"), "a ticket closed without expo");

  for (const ticket of detail.tickets) {
    assert(ticket.inputTokens > 0 && ticket.outputTokens > 0, `${ticket.station} has no tokens`);
    const expected = costUsd(ticket.inputTokens, ticket.outputTokens);
    assert(Math.abs(expected - ticket.costUsd) < 1e-9, `${ticket.station} cost does not match the price table`);
  }

  assert(sauce.costUsd > sauce.budgetUsd, "sauce should go over the ticket budget");
  assert(grill.costUsd < grill.budgetUsd, "grill should stay under the ticket budget");
  assert(sauce.costUsd > grill.costUsd && grill.costUsd > prep.costUsd, "sauce should be the expensive cook");
  assert(grill.files.includes("src/app/checkout.ts"), "grill should claim checkout.ts");
  assert(sauce.files.includes("src/app/checkout.ts"), "sauce should claim checkout.ts after waiting");

  const types = new Set(detail.events.map((event) => event.type));
  assert(types.has("budget.exceeded"), "missing budget.exceeded");
  assert(types.has("budget.warning"), "missing budget.warning");
  assert(types.has("file.waiting"), "missing file.waiting");
  assert(types.has("file.claimed"), "missing file.claimed");
  assert(types.has("tokens.used"), "missing tokens.used");

  const exceeded = detail.events.filter((event) => event.type === "budget.exceeded");
  assert(exceeded.length === 1 && exceeded[0]?.ticketId === sauce.id, "only sauce should exceed budget");

  assert(messages.some((message) => message.type === "snapshot"), "websocket missed the snapshot");
  assert(messages.some((message) => message.type === "event"), "websocket missed live events");

  const expoMock = await fetch(`${base}/api/orders/${orderId}/expo`, { method: "POST" });
  assert(expoMock.status === 400, `mock expo should refuse git tests, got ${expoMock.status}`);
  const stillReady = await fetch(`${base}/api/orders/${orderId}`);
  const stillBody = (await stillReady.json()) as OrderDetail;
  assert(stillBody.order.status === "ready", "mock expo must not serve the order");

  await checkRepoWorkspace(base);

  console.log("smoke ok");
  console.log(
    `costs alma=${money(head)} jules=${money(prep)} rio=${money(grill)} nia=${money(sauce)} budget=${sauce.budgetUsd}`,
  );
  } finally {
    socket.close();
    await started.close();
  }
}

async function checkRepoWorkspace(base: string): Promise<void> {
  const { execFileSync } = await import("node:child_process");
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "kitchen-repo-"));
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "kitchen-plain-"));
  try {
    execFileSync("git", ["init", "-b", "master"], { cwd: repo });
    fs.writeFileSync(path.join(repo, "README.md"), "hello\n");
    execFileSync("git", ["-c", "user.email=smoke@kitchen.line", "-c", "user.name=smoke", "add", "README.md"], {
      cwd: repo,
    });
    execFileSync(
      "git",
      ["-c", "user.email=smoke@kitchen.line", "-c", "user.name=smoke", "commit", "-m", "init"],
      { cwd: repo },
    );
    const before = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();

    const missing = await fetch(`${base}/api/workspace`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoPath: plain }),
    });
    assert(missing.status === 400, `non-git folder should be rejected, got ${missing.status}`);

    const saved = await fetch(`${base}/api/workspace`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoPath: repo, testCommand: "npm test" }),
    });
    const savedBody = (await saved.json()) as { workspace?: { repoPath: string; testCommand: string }; error?: string };
    assert(saved.status === 200, savedBody.error ?? "workspace save failed");
    assert(savedBody.workspace?.testCommand === "npm test", "test command was not remembered");
    const afterSave = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
    assert(afterSave === before, "saving a repo path should not change git");

    const state = await fetch(`${base}/api/state`);
    const stateBody = (await state.json()) as { workspace: { repoPath: string; testCommand: string; sandboxPath: string } };
    assert(stateBody.workspace.repoPath === savedBody.workspace?.repoPath, "snapshot forgot the repo path");
    assert(stateBody.workspace.sandboxPath === "/sandbox", "mock root should stay /sandbox");

    const workspace = await import("../src/workspace");
    const db = await import("../src/db");
    let escaped = false;
    try {
      workspace.writeWorkFile(repo, "../outside.txt", "nope");
    } catch {
      escaped = true;
    }
    assert(escaped, "a path outside the repo was allowed");
    fs.symlinkSync(os.tmpdir(), path.join(repo, "leak"));
    let linked = false;
    try {
      workspace.writeWorkFile(repo, "leak/pwned.txt", "nope");
    } catch {
      linked = true;
    }
    assert(linked, "a symlink out of the repo was allowed");

    const opened = workspace.createWorkBranch(repo, "Add a payment section");
    assert(opened.branch.startsWith("kitchen-line/add-a-payment-section-"), opened.branch);
    const head = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
    assert(head === opened.branch, `expected checkout of ${opened.branch}, got ${head}`);
    workspace.writeWorkFile(repo, "notes/plated.txt", "served\n");
    assert(workspace.readWorkFile(repo, "notes/plated.txt") === "served\n", "read back failed");
    assert(workspace.listChangedFiles(repo, opened.baseSha).includes("notes/plated.txt"), "changed files missed the write");

    const realId = "ord_smoke_real";
    db.insertOrder({
      id: realId,
      title: "Add a payment section",
      acceptanceCriteria: ["tests pass"],
      status: "ready",
      ticketBudgetUsd: 0.05,
      mode: "anthropic",
      repoPath: repo,
      branch: opened.branch,
      baseSha: opened.baseSha,
      testCommand: "node -e process.exit(0)",
      changedFiles: [],
      createdAt: Date.now(),
      servedAt: null,
    });
    const servedRes = await fetch(`${base}/api/orders/${realId}/expo`, { method: "POST" });
    const servedBody = (await servedRes.json()) as { order?: OrderDetail["order"]; error?: string };
    assert(servedRes.status === 200, servedBody.error ?? "expo did not serve the real order");
    assert(servedBody.order?.status === "served", "real order was not served");
    assert(servedBody.order?.branch === opened.branch, "served order lost its branch");
    assert(servedBody.order?.changedFiles.includes("notes/plated.txt"), "served order lost the changed file");
    const servedDetail = (await (await fetch(`${base}/api/orders/${realId}`)).json()) as OrderDetail;
    assert(
      servedDetail.events.some((event) => event.message.includes("Review with git diff, then merge if it looks good.")),
      "served note missing",
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(plain, { recursive: true, force: true });
  }
}

function money(ticket: Ticket): string {
  return ticket.costUsd.toFixed(4);
}

async function waitForReady(base: string, orderId: string): Promise<OrderDetail> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    const response = await fetch(`${base}/api/orders/${orderId}`);
    const body = (await response.json()) as OrderDetail;
    if (body.order.status === "ready" || body.order.status === "cancelled") return body;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("timed out waiting for the demo order");
}

try {
  await main();
} finally {
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(dbPath + suffix, { force: true });
  }
}
