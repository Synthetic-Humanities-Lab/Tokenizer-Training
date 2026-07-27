import { describe, expect, it } from "vitest";
import { computeSettingsLayout } from "../src/game/systems/SettingsLayoutSystem";
import type { LayoutRect } from "../src/game/systems/PlayLayoutSystem";
import type { SafeAreaInput } from "../src/game/systems/SafeAreaSystem";

const PHONE_SAFE_AREA = { top: 59, right: 0, bottom: 34, left: 0 };

interface LayoutCase {
  name: string;
  width: number;
  height: number;
  mobileSurface: boolean;
  safeArea?: SafeAreaInput;
  expected: ReturnType<typeof computeSettingsLayout>;
}

const CASES: LayoutCase[] = [
  {
    name: "320x568 compact phone",
    width: 320,
    height: 568,
    mobileSurface: true,
    expected: {
      compact: true,
      card: { x: 160, y: 284, width: 296, height: 500 },
      title: { x: 160, y: 80, fontSize: 32, width: 248 },
      status: { x: 160, y: 142, fontSize: 14, width: 244 },
      soundButton: { x: 160, y: 206, width: 256, height: 48 },
      resetButton: { x: 160, y: 264, width: 256, height: 48 },
      resetDialog: { x: 160, y: 284, width: 264, height: 232 },
      resetDialogTitle: { x: 160, y: 204, fontSize: 22, width: 224 },
      resetDialogMessage: { x: 160, y: 266, fontSize: 14, width: 224 },
      resetCancelButton: { x: 101, y: 352, width: 106, height: 48 },
      resetConfirmButton: { x: 219, y: 352, width: 106, height: 48 },
      reducedMotionControl: { x: 160, y: 322, width: 256, height: 48 },
      hapticsControl: { x: 160, y: 380, width: 256, height: 48 },
      backButton: { x: 160, y: 494, width: 256, height: 48 }
    }
  },
  {
    name: "368x552 compact phone",
    width: 368,
    height: 552,
    mobileSurface: true,
    expected: {
      compact: true,
      card: { x: 184, y: 276, width: 344, height: 500 },
      title: { x: 184, y: 72, fontSize: 32, width: 296 },
      status: { x: 184, y: 134, fontSize: 14, width: 292 },
      soundButton: { x: 184, y: 198, width: 304, height: 48 },
      resetButton: { x: 184, y: 256, width: 304, height: 48 },
      resetDialog: { x: 184, y: 276, width: 264, height: 232 },
      resetDialogTitle: { x: 184, y: 196, fontSize: 22, width: 224 },
      resetDialogMessage: { x: 184, y: 258, fontSize: 14, width: 224 },
      resetCancelButton: { x: 125, y: 344, width: 106, height: 48 },
      resetConfirmButton: { x: 243, y: 344, width: 106, height: 48 },
      reducedMotionControl: { x: 184, y: 314, width: 304, height: 48 },
      hapticsControl: { x: 184, y: 372, width: 304, height: 48 },
      backButton: { x: 184, y: 486, width: 304, height: 48 }
    }
  },
  {
    name: "390x844 safe-area phone",
    width: 390,
    height: 844,
    mobileSurface: true,
    safeArea: PHONE_SAFE_AREA,
    expected: {
      compact: true,
      card: { x: 195, y: 434.5, width: 366, height: 500 },
      title: { x: 195, y: 230.5, fontSize: 32, width: 318 },
      status: { x: 195, y: 292.5, fontSize: 14, width: 314 },
      soundButton: { x: 195, y: 356.5, width: 320, height: 48 },
      resetButton: { x: 195, y: 414.5, width: 320, height: 48 },
      resetDialog: { x: 195, y: 434.5, width: 264, height: 232 },
      resetDialogTitle: { x: 195, y: 354.5, fontSize: 22, width: 224 },
      resetDialogMessage: { x: 195, y: 416.5, fontSize: 14, width: 224 },
      resetCancelButton: { x: 136, y: 502.5, width: 106, height: 48 },
      resetConfirmButton: { x: 254, y: 502.5, width: 106, height: 48 },
      reducedMotionControl: { x: 195, y: 472.5, width: 320, height: 48 },
      hapticsControl: { x: 195, y: 530.5, width: 320, height: 48 },
      backButton: { x: 195, y: 644.5, width: 320, height: 48 }
    }
  },
  {
    name: "1280x720 desktop",
    width: 1280,
    height: 720,
    mobileSurface: false,
    expected: {
      compact: false,
      card: { x: 640, y: 360, width: 620, height: 500 },
      title: { x: 640, y: 160, fontSize: 36, width: 572 },
      status: { x: 640, y: 222, fontSize: 15, width: 568 },
      soundButton: { x: 640, y: 286, width: 260, height: 44 },
      resetButton: { x: 640, y: 342, width: 260, height: 44 },
      resetDialog: { x: 640, y: 360, width: 264, height: 232 },
      resetDialogTitle: { x: 640, y: 280, fontSize: 22, width: 224 },
      resetDialogMessage: { x: 640, y: 342, fontSize: 14, width: 224 },
      resetCancelButton: { x: 581, y: 428, width: 106, height: 48 },
      resetConfirmButton: { x: 699, y: 428, width: 106, height: 48 },
      reducedMotionControl: { x: 640, y: 398, width: 260, height: 44 },
      hapticsControl: { x: 640, y: 454, width: 260, height: 44 },
      backButton: { x: 640, y: 568, width: 260, height: 44 }
    }
  }
];

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function textEdges(text: { x: number; y: number; width: number; fontSize: number }, lineCount: number) {
  return edges({
    x: text.x,
    y: text.y,
    width: text.width,
    height: text.fontSize * 1.4 * lineCount
  });
}

function expectContained(inner: ReturnType<typeof edges>, outer: ReturnType<typeof edges>) {
  expect(inner.left).toBeGreaterThanOrEqual(outer.left);
  expect(inner.right).toBeLessThanOrEqual(outer.right);
  expect(inner.top).toBeGreaterThanOrEqual(outer.top);
  expect(inner.bottom).toBeLessThanOrEqual(outer.bottom);
}

describe("SettingsLayoutSystem", () => {
  it.each(CASES)("computes stable geometry for $name", ({ width, height, mobileSurface, safeArea, expected }) => {
    expect(computeSettingsLayout(width, height, mobileSurface, safeArea)).toEqual(expected);
  });

  it.each(CASES)("keeps controls contained and non-overlapping for $name", ({
    width,
    height,
    mobileSurface,
    safeArea
  }) => {
    const layout = computeSettingsLayout(width, height, mobileSurface, safeArea);
    const safe = {
      top: safeArea?.top ?? 0,
      right: safeArea?.right ?? 0,
      bottom: safeArea?.bottom ?? 0,
      left: safeArea?.left ?? 0
    };
    const card = edges(layout.card);
    const controls = [
      layout.soundButton,
      layout.resetButton,
      layout.reducedMotionControl,
      layout.hapticsControl,
      layout.backButton
    ];

    expect(card.left).toBeGreaterThanOrEqual(safe.left);
    expect(card.right).toBeLessThanOrEqual(width - safe.right);
    expect(card.top).toBeGreaterThanOrEqual(safe.top);
    expect(card.bottom).toBeLessThanOrEqual(height - safe.bottom);

    for (const control of controls) {
      const bounds = edges(control);
      expect(bounds.left).toBeGreaterThanOrEqual(card.left);
      expect(bounds.right).toBeLessThanOrEqual(card.right);
      expect(bounds.top).toBeGreaterThanOrEqual(card.top);
      expect(bounds.bottom).toBeLessThanOrEqual(card.bottom);
      expect(control.height).toBeGreaterThanOrEqual(44);
    }

    expect(edges(layout.soundButton).bottom).toBeLessThan(edges(layout.resetButton).top);
    expect(edges(layout.resetButton).bottom).toBeLessThan(edges(layout.reducedMotionControl).top);
    expect(edges(layout.reducedMotionControl).bottom).toBeLessThan(edges(layout.hapticsControl).top);
    expect(edges(layout.hapticsControl).bottom).toBeLessThan(edges(layout.backButton).top);
  });

  it.each(CASES)("keeps the reset confirmation contained and non-overlapping for $name", ({
    width,
    height,
    mobileSurface,
    safeArea
  }) => {
    const layout = computeSettingsLayout(width, height, mobileSurface, safeArea);
    const card = edges(layout.card);
    const dialog = edges(layout.resetDialog);
    const title = textEdges(layout.resetDialogTitle, 1);
    const message = textEdges(layout.resetDialogMessage, 4);
    const cancel = edges(layout.resetCancelButton);
    const confirm = edges(layout.resetConfirmButton);

    expectContained(dialog, card);
    expectContained(title, dialog);
    expectContained(message, dialog);
    expectContained(cancel, dialog);
    expectContained(confirm, dialog);

    expect(title.bottom).toBeLessThan(message.top);
    expect(message.bottom).toBeLessThan(cancel.top);
    expect(layout.resetCancelButton.x).toBeLessThan(layout.resetConfirmButton.x);
    expect(cancel.right).toBeLessThan(confirm.left);
    expect(layout.resetCancelButton.y).toBe(layout.resetConfirmButton.y);

    for (const button of [layout.resetCancelButton, layout.resetConfirmButton]) {
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
  });

  it("keeps dialog copy wrapping stable across supported surfaces", () => {
    const layouts = CASES.map(({ width, height, mobileSurface, safeArea }) =>
      computeSettingsLayout(width, height, mobileSurface, safeArea)
    );

    expect(layouts.map((layout) => layout.resetDialogTitle.width)).toEqual([224, 224, 224, 224]);
    expect(layouts.map((layout) => layout.resetDialogMessage.width)).toEqual([224, 224, 224, 224]);
  });
});
