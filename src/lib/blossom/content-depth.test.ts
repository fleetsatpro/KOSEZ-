import assert from "node:assert/strict";
import test from "node:test";
import { EVENTS, CATALOGUE, TANDEM_PROMPTS } from "./data.ts";
import { GRAMMAR_TASKS, LISTENING_TASKS } from "./lab-content.ts";

test("content banks keep a useful minimum depth", () => {
  assert.ok(EVENTS.length >= 9);
  assert.ok(CATALOGUE.length >= 8);
  assert.ok(GRAMMAR_TASKS.length >= 19);
  assert.ok(LISTENING_TASKS.length >= 18);
  assert.ok(TANDEM_PROMPTS.english.length >= 10);
  assert.ok(TANDEM_PROMPTS.french.length >= 10);
});

test("new practice surfaces are structurally complete", () => {
  const addedEventIds = [
    "evt-office-clinic",
    "evt-phone-practice",
    "evt-writing-table",
    "evt-b1-circle",
    "evt-coast-story",
  ];
  for (const id of addedEventIds) {
    const event = EVENTS.find((item) => item.id === id);
    assert.ok(event, `missing event ${id}`);
    assert.ok(event?.title);
    assert.ok(event?.blurb);
    assert.match(event?.time ?? "", /^\d{2}:\d{2}$/);
  }

  for (const id of [
    "grammar-question-6",
    "grammar-question-7",
    "grammar-question-8",
    "grammar-question-9",
    "grammar-b1-7",
    "grammar-b1-8",
    "grammar-b1-9",
    "grammar-b1-10",
  ]) {
    const task = GRAMMAR_TASKS.find((item) => item.id === id);
    assert.ok(task, `missing grammar task ${id}`);
    assert.ok(task?.choices.length >= 3);
    assert.ok(task?.answer);
  }

  for (const id of [
    "listen-5",
    "listen-6",
    "listen-7",
    "listen-8",
    "listen-b1-7",
    "listen-b1-8",
    "listen-b1-9",
    "listen-b1-10",
  ]) {
    const task = LISTENING_TASKS.find((item) => item.id === id);
    assert.ok(task, `missing listening task ${id}`);
    assert.ok(task?.audioText);
    assert.ok(task?.choices.length >= 3);
    assert.ok(task?.answer);
  }
});
