import type { Order } from "@kitchen/shared";
import * as db from "./db";
import { HttpError } from "./errors";
import { markServed, postEvent } from "./line";
import { runTestCommand } from "./workspace";

export function passExpo(orderId: string): Order {
  const order = db.getOrder(orderId);
  if (!order) throw new HttpError(404, "No order with that id.");
  if (order.mode === "mock") {
    throw new HttpError(400, "Mock mode stays in /sandbox and does not run the repo test command.");
  }
  if (!order.repoPath) throw new HttpError(400, "This order has no repo.");

  const result = runTestCommand(order.repoPath, order.testCommand);
  if (!result.ok) {
    postEvent(order.id, null, "expo.failed", `Expo ran ${order.testCommand} and it failed.`, {
      output: result.output.slice(0, 2000),
    });
    throw new HttpError(422, "The test command failed, so the order stays open.");
  }

  postEvent(order.id, null, "expo.tests", `Expo ran ${order.testCommand}.`, { ok: true });
  return markServed(order.id);
}
