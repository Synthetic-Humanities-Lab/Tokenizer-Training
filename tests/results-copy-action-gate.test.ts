import { describe, expect, it } from "vitest";
import {
  ResultsCopyActionGate,
  type ResultsCopyAction
} from "../src/game/systems/ResultsCopySystem";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function runCopy(
  gate: ResultsCopyActionGate,
  completion: Promise<string>,
  updates: string[]
): Promise<void> {
  const action = gate.tryBegin();
  if (!action) {
    return;
  }

  try {
    const value = await completion;
    if (gate.isCurrent(action)) {
      updates.push(value);
    }
  } finally {
    gate.finish(action);
  }
}

describe("results copy action lifecycle", () => {
  it("prevents a stale copy from mutating a recreated scene or releasing its newer copy", async () => {
    const gate = new ResultsCopyActionGate();
    const updates: string[] = [];
    const first = deferred<string>();
    const second = deferred<string>();

    gate.beginLifecycle();
    const firstRun = runCopy(gate, first.promise, updates);

    gate.beginLifecycle();
    const secondRun = runCopy(gate, second.promise, updates);

    first.resolve("old scene");
    await firstRun;

    expect(updates).toEqual([]);
    expect(gate.tryBegin()).toBeNull();

    second.resolve("new scene");
    await secondRun;

    expect(updates).toEqual(["new scene"]);
    expect(gate.tryBegin()).toEqual<ResultsCopyAction>({
      lifecycleToken: 2,
      actionToken: 3
    });
  });

  it("allows only one copy operation within a lifecycle", () => {
    const gate = new ResultsCopyActionGate();

    gate.beginLifecycle();
    const action = gate.tryBegin();

    expect(action).not.toBeNull();
    expect(gate.tryBegin()).toBeNull();
    expect(gate.finish(action!)).toBe(true);
    expect(gate.tryBegin()).not.toBeNull();
  });
});
