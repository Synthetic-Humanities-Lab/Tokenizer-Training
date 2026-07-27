import { describe, expect, it } from "vitest";
import { CutUndoSystem } from "../src/game/systems/CutUndoSystem";

describe("CutUndoSystem", () => {
  it("restores the cut state from before one multi-cut swipe", () => {
    const undo = new CutUndoSystem();

    undo.beginGesture([2]);
    expect(undo.completeGesture([2, 5, 8])).toBe(true);
    expect(undo.undo()).toEqual([2]);
    expect(undo.canUndo()).toBe(false);
  });

  it("does not record a swipe that leaves cuts unchanged", () => {
    const undo = new CutUndoSystem();

    undo.beginGesture([2, 5]);
    expect(undo.completeGesture([2, 5])).toBe(false);
    expect(undo.undo()).toBeUndefined();
  });

  it("restores cuts removed by a corrective swipe", () => {
    const undo = new CutUndoSystem();

    undo.beginGesture([2, 5, 8]);
    undo.completeGesture([2, 8]);
    expect(undo.undo()).toEqual([2, 5, 8]);
  });

  it("clears history between prompts", () => {
    const undo = new CutUndoSystem();

    undo.beginGesture([]);
    undo.completeGesture([3]);
    undo.clear();
    expect(undo.canUndo()).toBe(false);
  });
});
