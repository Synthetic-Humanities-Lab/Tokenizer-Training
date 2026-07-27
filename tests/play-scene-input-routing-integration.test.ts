import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function playSceneSource(): string {
  return readFileSync(
    fileURLToPath(new URL("../src/game/scenes/PlayScene.ts", import.meta.url)),
    "utf8"
  );
}

function method(source: string, start: string, next: string): string {
  const startIndex = source.indexOf(start);
  return source.slice(startIndex, source.indexOf(next, startIndex + start.length));
}

describe("PlayScene input routing integration", () => {
  it("routes all controls and the slice stream through one PlayScene owner", () => {
    const source = playSceneSource();
    const bindControls = method(source, "  private bindPlayControls", "  private disposePlayControlBindings");
    const pointer = method(source, "  private handlePointer(", "  private applyPointerCutSample");

    expect(source).toContain("private readonly playInputRouter = new PlayInputRoutingSystem();");
    expect(bindControls.match(/bindPlayControlActivation\(\{/g)).toHaveLength(4);
    for (const controlId of ["resolve", "clear", "undo", "exit"]) {
      expect(bindControls).toContain(`controlId: "${controlId}"`);
    }
    expect(source).not.toMatch(/this\.(resolve|clear|mute|exit)Button\.on\("pointer(up|down)"/);
    expect(source).toContain('this.input.on("pointerdown", this.handlePointerDown, this);');
    expect(source).toContain('this.input.on("pointermove", this.handlePointerMove, this);');
    expect(pointer).toContain("canStartSlice: boolean");
    expect(pointer).toContain("this.playInputRouter.beginSlice(pointer)");
    expect(pointer).toContain("this.playInputRouter.continueSlice(pointer)");
    expect(pointer).toContain("this.playInputRouter.ownsPointer(pointer)");
    expect(pointer.indexOf("this.playInputRouter.continueSlice(pointer)")).toBeLessThan(
      pointer.indexOf("this.applyPointerCutSample(point)")
    );
    expect(pointer.indexOf("this.inputModality = mergeInputModality")).toBeGreaterThan(
      pointer.indexOf("this.playInputRouter.ownsPointer(pointer)")
    );
  });

  it("separates valid release, canceled release, and pointerless gameout", () => {
    const source = playSceneSource();
    const end = method(source, "  private handlePointerGestureEnd", "  private handlePointerGestureCancel");
    const cancel = method(source, "  private handlePointerGestureCancel", "  private handlePointerGameOut");
    const gameout = method(source, "  private handlePointerGameOut", "  private completeCanceledPlayInput");
    const complete = method(source, "  private completeSliceGesture", "  private existingCutsTouchedByPointer");

    expect(end).toContain("const owner = this.playInputRouter.endPointer(pointer);");
    expect(end).toContain("this.completeSliceGesture(pointer, pointer.wasTouch && pointer.wasCanceled);");
    expect(cancel).toContain("const owner = this.playInputRouter.endPointer(pointer);");
    expect(cancel).toContain("this.completeCanceledPlayInput(owner);");
    expect(gameout).toContain("const owner = this.playInputRouter.cancelAll();");
    expect(gameout).not.toContain("pointer.");
    expect(complete).toContain("if (!canceled && !this.resolving");
    expect(complete).toContain("const shouldShowNoCutFeedback = !canceled");
  });

  it("cleans ownership across resolution, focus loss, outside release, and shutdown", () => {
    const source = playSceneSource();
    const resolve = method(source, "  private resolveRound", "  private resetPlayControlVisual");
    const focusLoss = method(source, "  private pauseActiveRoundForFocusLoss", "  private resumeActiveRoundAfterFocusReturn");
    const shutdown = source.slice(source.indexOf("  private shutdownScene"));
    const startRound = method(source, "  private startRound", "  private pickFixture");
    const clearCuts = method(source, "  private clearPlayerCuts", "  private exitToMenu");

    expect(resolve).toContain("const interruptedOwner = this.playInputRouter.cancelAll();");
    expect(focusLoss).toContain("const interruptedOwner = this.playInputRouter.cancelAll();");
    expect(source).toContain('this.input.on("pointerupoutside", this.handlePointerGestureCancel, this);');
    expect(source).toContain('this.input.on("gameout", this.handlePointerGameOut, this);');
    expect(shutdown).toContain("this.playInputRouter.cancelAll();");
    expect(shutdown).toContain("this.resetTransientSliceState();");
    expect(shutdown).toContain("this.disposePlayControlBindings();");
    expect(shutdown).toContain('this.input.off("gameout", this.handlePointerGameOut, this);');
    expect(startRound).toContain("this.resetTransientSliceState();");
    expect(clearCuts).toContain("const interruptedOwner = this.playInputRouter.cancelAll();");
    expect(clearCuts).toContain("this.resetTransientSliceState();");
  });
});
