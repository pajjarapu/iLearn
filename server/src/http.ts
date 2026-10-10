import type { PlaceOrderInput } from "@kitchen/shared";
import cors from "cors";
import express from "express";
import { config } from "./config";
import { HttpError } from "./errors";
import { passExpo } from "./expo";
import { demoOrderInput, orderDetail, placeOrder, resetLine, snapshot } from "./line";
import { runMockOrder } from "./mock";
import { inspectRepo, normalizeTestCommand } from "./workspace";
import * as db from "./db";

function sendError(res: express.Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error("[kitchen]", error);
  res.status(500).json({ error: "Something broke on the line." });
}

function readOrder(body: unknown): PlaceOrderInput {
  if (!body || typeof body !== "object") throw new HttpError(400, "Expected a JSON object.");
  const record = body as Record<string, unknown>;
  if (typeof record.title !== "string") throw new HttpError(400, "The order needs a title.");

  let acceptanceCriteria: string[] | undefined;
  if (record.acceptanceCriteria !== undefined) {
    if (!Array.isArray(record.acceptanceCriteria) || record.acceptanceCriteria.some((item) => typeof item !== "string")) {
      throw new HttpError(400, "Acceptance criteria must be a list of strings.");
    }
    acceptanceCriteria = record.acceptanceCriteria;
  }

  let ticketBudgetUsd: number | undefined;
  if (record.ticketBudgetUsd !== undefined) {
    if (typeof record.ticketBudgetUsd !== "number") {
      throw new HttpError(400, "Ticket budget must be a number of dollars.");
    }
    ticketBudgetUsd = record.ticketBudgetUsd;
  }

  let repoPath: string | undefined;
  if (record.repoPath !== undefined) {
    if (typeof record.repoPath !== "string") throw new HttpError(400, "Repo path must be a string.");
    repoPath = record.repoPath;
  }

  let testCommand: string | undefined;
  if (record.testCommand !== undefined) {
    if (typeof record.testCommand !== "string") throw new HttpError(400, "Test command must be a string.");
    testCommand = record.testCommand;
  }

  return { title: record.title, acceptanceCriteria, ticketBudgetUsd, repoPath, testCommand };
}

function paramId(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

export function createHttpApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, mockAgents: config.mockAgents });
  });

  app.get("/api/state", (_req, res) => {
    res.json(snapshot());
  });

  app.get("/api/orders/:id", (req, res) => {
    const detail = orderDetail(paramId(req.params.id));
    if (!detail) {
      res.status(404).json({ error: "No order with that id." });
      return;
    }
    res.json(detail);
  });

  app.post("/api/workspace", (req, res) => {
    try {
      const body = req.body as Record<string, unknown> | null;
      if (!body || typeof body !== "object") throw new HttpError(400, "Expected a JSON object.");
      if (body.repoPath !== undefined) {
        if (typeof body.repoPath !== "string") throw new HttpError(400, "Repo path must be a string.");
        const typed = body.repoPath.trim();
        db.setSetting("repoPath", typed ? inspectRepo(typed).repoPath : "");
      }
      if (body.testCommand !== undefined) {
        if (typeof body.testCommand !== "string") throw new HttpError(400, "Test command must be a string.");
        db.setSetting("testCommand", normalizeTestCommand(body.testCommand));
      }
      res.json({ workspace: db.workspaceSettings() });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/orders", (req, res) => {
    try {
      const order = placeOrder(readOrder(req.body));
      if (config.mockAgents) void runMockOrder(order.id);
      res.status(201).json({ order });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/orders/:id/expo", (req, res) => {
    try {
      const order = passExpo(paramId(req.params.id));
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/demo", (_req, res) => {
    try {
      const order = placeOrder(demoOrderInput());
      void runMockOrder(order.id);
      res.status(201).json({ order });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/reset", (_req, res) => {
    resetLine();
    res.json({ ok: true });
  });

  return app;
}
