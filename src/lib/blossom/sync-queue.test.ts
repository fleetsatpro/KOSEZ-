import assert from "node:assert/strict";
import test from "node:test";
import { createSerialQueue } from "./sync-queue.ts";

test("serial queue preserves submission order even when the first task is slow", async () => {
  const queue = createSerialQueue();
  const order: string[] = [];
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = queue.enqueue(async () => {
    order.push("first:start");
    await firstGate;
    order.push("first:end");
  });

  const second = queue.enqueue(async () => {
    order.push("second");
  });

  await Promise.resolve();
  assert.deepEqual(order, ["first:start"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(order, ["first:start", "first:end", "second"]);
});

test("a rejected task does not poison the queue", async () => {
  const queue = createSerialQueue();
  await assert.rejects(queue.enqueue(async () => {
    throw new Error("expected");
  }), /expected/);

  const order: string[] = [];
  await queue.enqueue(async () => {
    order.push("survived");
  });
  assert.deepEqual(order, ["survived"]);
});
