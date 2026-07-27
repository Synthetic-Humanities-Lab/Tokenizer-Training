import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { LayoutRect } from "../src/game/systems/PlayLayoutSystem";
import {
  computeTutorialIntakeLayout,
  tutorialIntakeCopy,
  tutorialIntakePageCount,
  tutorialIntakeQaSnapshot,
  tutorialIntakeRoutes,
  tutorialIntakeSemanticSnapshot
} from "../src/game/systems/TutorialIntakeSystem";

const tutorialSceneSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/TutorialScene.ts", import.meta.url)),
  "utf8"
);
const menuSceneSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/MenuScene.ts", import.meta.url)),
  "utf8"
);

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function contains(outer: LayoutRect, inner: LayoutRect): boolean {
  const outerEdges = edges(outer);
  const innerEdges = edges(inner);
  return (
    innerEdges.left >= outerEdges.left &&
    innerEdges.right <= outerEdges.right &&
    innerEdges.top >= outerEdges.top &&
    innerEdges.bottom <= outerEdges.bottom
  );
}

function overlaps(a: LayoutRect, b: LayoutRect): boolean {
  const aEdges = edges(a);
  const bEdges = edges(b);
  return (
    aEdges.left < bEdges.right &&
    aEdges.right > bEdges.left &&
    aEdges.top < bEdges.bottom &&
    aEdges.bottom > bEdges.top
  );
}

function blockRect(block: { x: number; y: number; width: number; height: number }): LayoutRect {
  return {
    ...block,
    x: "align" in block && block.align === "left" ? block.x + block.width / 2 : block.x
  };
}

function estimatedWrappedLineCount(text: string, maxCharsPerLine: number): number {
  let lines = 1;
  let currentLength = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const nextLength = currentLength === 0 ? word.length : currentLength + 1 + word.length;
    if (nextLength <= maxCharsPerLine) {
      currentLength = nextLength;
    } else {
      lines += 1;
      currentLength = word.length;
    }
  }
  return lines;
}

describe("Tutorial intake", () => {
  it("keeps the route contract explicit from menu intake through tutorial play", () => {
    expect(tutorialIntakeRoutes).toEqual({
      entry: { scene: "TutorialScene" },
      clockIn: { scene: "PlayScene", data: { tutorial: true, startSource: "menu" } },
      back: { scene: "MenuScene" }
    });
    expect(menuSceneSource).toContain('this.scene.start(tutorialIntakeRoutes.entry.scene);');
    expect(tutorialSceneSource).toContain(
      "this.scene.start(tutorialIntakeRoutes.clockIn.scene, tutorialIntakeRoutes.clockIn.data);"
    );
    expect(tutorialSceneSource).toContain('this.scene.start(tutorialIntakeRoutes.back.scene);');
  });

  it.each([
    { label: "iPhone SE", width: 375, height: 667, safeArea: { top: 20, right: 0, bottom: 0, left: 0 } },
    { label: "large notched portrait", width: 390, height: 844, safeArea: { top: 59, right: 0, bottom: 34, left: 0 } },
    { label: "desktop", width: 1280, height: 720, safeArea: undefined }
  ])("keeps every orientation page inside bounds without collisions on $label", ({ width, height, safeArea }) => {
    for (let pageIndex = 0; pageIndex < tutorialIntakePageCount(); pageIndex += 1) {
      const copy = tutorialIntakeCopy(pageIndex);
      const layout = computeTutorialIntakeLayout(width, height, safeArea, pageIndex);
      const panelEdges = edges(layout.panel);

      expect(panelEdges.left).toBeGreaterThanOrEqual(safeArea?.left ?? 0);
      expect(panelEdges.right).toBeLessThanOrEqual(width - (safeArea?.right ?? 0));
      expect(panelEdges.top).toBeGreaterThanOrEqual(safeArea?.top ?? 0);
      expect(panelEdges.bottom).toBeLessThanOrEqual(height - (safeArea?.bottom ?? 0));
      expect(contains(layout.panel, layout.wienerBubble)).toBe(true);
      expect(contains(layout.panel, layout.mascot)).toBe(true);
      expect(contains(layout.panel, layout.progress)).toBe(true);
      expect(contains(layout.panel, layout.primaryButton)).toBe(true);
      expect(contains(layout.panel, layout.secondaryButton)).toBe(true);
      expect(overlaps(layout.primaryButton, layout.secondaryButton)).toBe(false);
      expect(overlaps(blockRect(layout.wienerNote), layout.progress)).toBe(false);
      expect(contains(layout.wienerBubble, blockRect(layout.wienerNote))).toBe(true);
      expect(overlaps(layout.progress, layout.primaryButton)).toBe(false);
      expect(layout.primaryButton.height).toBeGreaterThanOrEqual(48);

      expect(overlaps(blockRect(layout.title), layout.mascot)).toBe(false);
      expect(overlaps(blockRect(layout.title), blockRect(layout.premise))).toBe(false);
      expect(overlaps(layout.mascot, blockRect(layout.premise))).toBe(false);
      expect(overlaps(layout.mascot, layout.wienerBubble)).toBe(false);
      expect(overlaps(blockRect(layout.premise), blockRect(layout.wienerNote))).toBe(false);
      expect(layout.mascot.y).toBeGreaterThan(layout.wienerBubble.y);

      expect(contains(layout.panel, layout.artifact)).toBe(true);
      expect(overlaps(blockRect(layout.premise), layout.artifact)).toBe(false);
      expect(overlaps(layout.artifact, layout.wienerBubble)).toBe(false);
    }
  });

  it("paces the new-hire story before introducing tokenizer vocabulary and controls", () => {
    const pages = Array.from({ length: tutorialIntakePageCount() }, (_, index) => tutorialIntakeCopy(index));

    expect(pages).toHaveLength(4);
    expect(pages.map((page) => page.title)).toEqual([
      "Your First Shift",
      "The Inference Pipeline",
      "Standard Tokenization Protocol",
      "Qualification"
    ]);
    expect(pages[0].premise).toBe(
      "Welcome to your first day at WienerWorks. You have been assigned to the Manual Tokenization Division."
    );
    expect(pages[0].wienerNote).toBe(
      "I am Wiener. Compute is expensive, and human attention cheap, so management has given me the impossible task of training you to replace the machine. Good luck."
    );
    expect(`${pages[0].premise} ${pages[0].wienerNote}`).not.toMatch(/cl100k_base|vocabulary ID/i);
    expect(pages.map((page) => page.premise).join(" ")).not.toMatch(/once handled|became expensive|automatically/i);
    expect(pages[1].premise).toContain("inference pipeline");
    expect(pages[1].premise).toContain("converted into tokens");
    expect(pages[1].wienerNote).toContain("tokens, not sentences");
    expect(pages[1].wienerNote).toContain("part of a word");
    expect(pages[1].wienerNote).toContain("A charming arrangement");
    expect(pages[0].artifact).toEqual({
      kind: "assignment",
      division: "MANUAL TOKENIZATION",
      status: "ORIENTATION IN PROGRESS"
    });
    expect(pages[1].artifact).toEqual({
      kind: "tokens",
      tokenStrings: ["please", " summarize", " this", " sentence"]
    });
    expect(pages[2].premise).toContain("Standard Tokenization Protocol");
    expect(pages[2].wienerNote).toContain("receives a number");
    expect(pages[2].wienerNote).toContain("identify and process it");
    expect(pages[2].wienerNote).toContain("resist assigning them meaning");
    expect(pages[2].artifact).toEqual({
      kind: "tokens",
      tokenStrings: ["please", " summarize", " this", " sentence"],
      tokenIds: [31121, 63179, 420, 11914]
    });
    expect(pages[3].premise).toContain("Machine Replacement Training");
    expect(pages[3].premise).toContain("Passing grants access");
    expect(pages[3].premise).toContain("40 TC operating account");
    expect(pages[3].wienerNote).toContain("Correct token prediction earns Token Credits (TC)");
    expect(pages[3].wienerNote).toContain("cost TCs to rework");
    expect(pages[3].wienerNote).toContain("invented fragments");
    expect(pages[3].wienerNote).toContain("At zero, access is revoked");
    expect(pages[3].wienerNote).toContain(
      "TCs are redeemable for WienerWorks inference. Management calls this compensation."
    );
    expect(pages[3].artifact).toEqual({
      kind: "qualification",
      steps: ["TUTORIAL", "QUALIFIED", "TRAINING"]
    });
    expect(pages.slice(0, -1).every((page) => page.primaryAction === "Continue")).toBe(true);
    expect(pages.at(-1)?.primaryAction).toBe("Clock In");
    expect(pages[0].secondaryAction).toBe("Return to Menu");
    expect(pages.slice(1).every((page) => page.secondaryAction === "Previous")).toBe(true);
  });

  it.each([
    { width: 320, height: 568 },
    { width: 368, height: 552 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 }
  ])("keeps every Wiener explanation within its speech region at $width x $height", ({ width, height }) => {
    for (let index = 0; index < tutorialIntakePageCount(); index += 1) {
      const layout = computeTutorialIntakeLayout(width, height, undefined, index);
      const maxCharsPerLine = Math.max(
        1,
        Math.floor(layout.wienerNote.width / (layout.wienerNote.fontSize * 0.62))
      );
      const lineCapacity = Math.floor(
        layout.wienerNote.height / (layout.wienerNote.fontSize * 1.35)
      );
      const explanation = tutorialIntakeCopy(index).wienerNote;
      expect(estimatedWrappedLineCount(explanation, maxCharsPerLine), explanation).toBeLessThanOrEqual(lineCapacity);
    }
  });

  it.each([
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 }
  ])("uses stable typography and vertical regions across pages at $width x $height", ({ width, height }) => {
    const layouts = Array.from(
      { length: tutorialIntakePageCount() },
      (_, index) => computeTutorialIntakeLayout(width, height, undefined, index)
    );

    expect(new Set(layouts.map((layout) => layout.title.fontSize)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.premise.fontSize)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.wienerNote.fontSize)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.title.y)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.premise.y)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.artifact.y)).size).toBe(1);
    expect(new Set(layouts.map((layout) => layout.wienerBubble.y)).size).toBe(1);
  });

  it("projects the rendered hierarchy and semantic controls from one canonical copy", () => {
    const copy = tutorialIntakeCopy(2);
    const layout = computeTutorialIntakeLayout(390, 844, { top: 59, right: 0, bottom: 34, left: 0 }, copy.pageIndex);
    const snapshot = tutorialIntakeQaSnapshot(390, 844, layout, copy);

    expect(snapshot.scene).toBe("TutorialScene");
    expect(snapshot.elements.map((element) => element.id)).toEqual([
      "panel",
      "title",
      "premise",
      "artifact",
      "wienerBubble",
      "wienerNote",
      "mascot",
      "progress",
      "primaryButton",
      "secondaryButton"
    ]);
    expect(snapshot.elements.find((element) => element.id === "title")?.text).toBe(copy.title);
    expect(snapshot.elements.find((element) => element.id === "premise")?.text).toBe(copy.premise);
    expect(snapshot.elements.find((element) => element.id === "wienerNote")?.text).toBe(copy.wienerNote);
    expect(snapshot.elements.find((element) => element.id === "primaryButton")?.text).toBe(copy.primaryAction);
    expect(snapshot.elements.find((element) => element.id === "secondaryButton")?.text).toBe(copy.secondaryAction);

    const semanticSnapshot = tutorialIntakeSemanticSnapshot(copy);
    expect(semanticSnapshot.summary).toContain(copy.premise);
    expect(semanticSnapshot.summary).toContain("please -> 31121");
    expect(semanticSnapshot.summary).toContain("summarize -> 63179");
    expect(semanticSnapshot.summary).toContain(copy.wienerNote);
    expect(semanticSnapshot).toMatchObject({
      scene: "tutorial-intake",
      heading: copy.title,
      actions: [
        { id: "continue", label: "Continue" },
        { id: "back", label: "Previous" }
      ],
      announcement: {
        id: "tutorial-intake:3",
        text: `${copy.title}\n${copy.premise}`,
        politeness: "polite"
      }
    });
  });

  it("routes canvas and semantic actions through the same guarded intake commands", () => {
    expect(tutorialSceneSource).toContain(
      "this.createButton(layout.primaryButton, copy.primaryAction, () => this.commandAdvance(), true);"
    );
    expect(tutorialSceneSource).toContain(
      "this.createButton(layout.secondaryButton, copy.secondaryAction, () => this.commandBack(), false);"
    );
    expect(tutorialSceneSource).toContain('if (actionId === "continue" || actionId === "clock-in") {\n      this.commandAdvance();');
    expect(tutorialSceneSource).toContain('if (actionId === "back") {\n      this.commandBack();');
    expect(tutorialSceneSource).toContain("if (!this.beginNavigation())");
    expect(tutorialSceneSource).toContain("if (this.navigationStarted)");
    expect(tutorialSceneSource).toContain('readSemanticRuntime(this.registry)?.mount("tutorial-intake"');
    expect(tutorialSceneSource).toContain("this.semanticLease?.dispose();");
    expect(tutorialSceneSource).toContain("if (!this.mascot?.active || this.motionPreference.reduced)");
    expect(tutorialSceneSource).toContain("y: this.mascotBaseY - 4");
    expect(tutorialSceneSource).toContain('ease: "Sine.easeInOut"');
  });
});
