import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginPracticeOnly,
  beginServerSession,
  idleLifecycle,
  lifecycleStatusCopy,
  markAbandoned,
  markActive,
  markFailed,
  markRewardConfirmed,
  markRewardPending,
  markServerVerified,
} from "./action-lifecycle.ts";

describe("action lifecycle state machine", () => {
  it("starts idle without ceremony or reward claims", () => {
    const life = idleLifecycle();
    assert.equal(life.phase, "idle");
    assert.equal(life.mayShowGrowthCeremony, false);
    assert.equal(life.mayClaimReward, false);
  });

  it("practice-only never becomes reward-eligible", () => {
    let life = beginPracticeOnly();
    life = markActive(life);
    life = markRewardPending(life);
    assert.equal(life.phase, "failed");
    assert.equal(life.mayShowGrowthCeremony, false);
    assert.equal(life.mayClaimReward, false);
  });

  it("happy path reaches reward_confirmed only after server verify", () => {
    let life = beginServerSession("sess-1");
    life = markActive(life);
    life = markServerVerified(life);
    life = markRewardPending(life);
    life = markRewardConfirmed(life);
    assert.equal(life.phase, "reward_confirmed");
    assert.equal(life.mayShowGrowthCeremony, true);
    assert.equal(life.mayClaimReward, true);
    assert.match(lifecycleStatusCopy(life), /enregistré/i);
  });

  it("reward before server verify fails", () => {
    let life = beginServerSession("sess-2");
    life = markActive(life);
    life = markRewardPending(life);
    assert.equal(life.phase, "failed");
    assert.equal(life.mayShowGrowthCeremony, false);
  });

  it("failure and abandon clear ceremony rights", () => {
    let life = beginServerSession("sess-3");
    life = markActive(life);
    life = markFailed(life, "timeout");
    assert.equal(life.mayShowGrowthCeremony, false);
    life = markAbandoned(beginServerSession("sess-4"));
    assert.equal(life.phase, "abandoned");
    assert.equal(life.mayClaimReward, false);
  });
});
