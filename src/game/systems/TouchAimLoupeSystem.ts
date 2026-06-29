import { splitGraphemes } from "./GraphemeSystem";
import type { GameQaRect } from "./GameQaSystem";
import type { PlaytestInputModality } from "./InputModalitySystem";
import type { BoundarySlot, Point } from "./SwipeCutSystem";

export interface TouchAimLoupeInput {
  compact: boolean;
  inputModality: PlaytestInputModality;
  viewport: { width: number; height: number };
  pointer: Point;
  text: string;
  textBounds: GameQaRect;
  slot: BoundarySlot | null;
  snapReady?: boolean;
}

export interface TouchAimLoupeState {
  visible: boolean;
  rect?: GameQaRect;
  text: string;
  boundary: number | null;
  snapReady: boolean;
  pointerClearancePx: number | null;
  occlusionSafe: boolean;
  placement: TouchAimLoupePlacement;
}

export interface TouchAimLoupeVisualStyle {
  accentAlpha: number;
  borderAlpha: number;
  centerLineWidth: number;
  centerLineAlpha: number;
  railAlpha: number;
  railHeight: number;
  sideRailWidth: number;
}

export type TouchAimLoupePlacement = "hidden" | "above" | "below";

export const TOUCH_AIM_LOUPE_WIDTH = 128;
export const TOUCH_AIM_LOUPE_HEIGHT = 42;
export const TOUCH_AIM_LOUPE_POINTER_CLEARANCE = 72;
export const TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE = 32;

export function touchAimLoupeState(input: TouchAimLoupeInput): TouchAimLoupeState {
  if (!input.slot || !shouldShowTouchAimLoupe(input.compact, input.inputModality)) {
    return {
      visible: false,
      text: "",
      boundary: null,
      snapReady: false,
      pointerClearancePx: null,
      occlusionSafe: false,
      placement: "hidden"
    };
  }

  const textTop = input.textBounds.y - input.textBounds.height / 2;
  const textBottom = input.textBounds.y + input.textBounds.height / 2;
  const placement = touchAimLoupePlacement(
    input.pointer,
    input.slot.x,
    input.viewport,
    textTop,
    textBottom,
    input.compact
  );
  const pointerClearancePx = touchAimLoupePointerClearance(input.pointer, placement.rect);

  return {
    visible: true,
    boundary: input.slot.index,
    snapReady: input.snapReady === true,
    text: touchAimLoupeText(input.text, input.slot.index),
    rect: placement.rect,
    pointerClearancePx,
    occlusionSafe: pointerClearancePx >= TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE,
    placement: placement.placement
  };
}

export function shouldShowTouchAimLoupe(compact: boolean, modality: PlaytestInputModality): boolean {
  return compact || modality === "touch" || modality === "pen" || modality === "mixed";
}

export function touchAimLoupeText(text: string, boundary: number): string {
  const graphemes = splitGraphemes(text);
  const normalizedBoundary = Math.max(0, Math.min(graphemes.length, Math.floor(boundary)));
  const before = graphemes.slice(Math.max(0, normalizedBoundary - 4), normalizedBoundary).join("");
  const after = graphemes.slice(normalizedBoundary, normalizedBoundary + 4).join("");

  return `${before}|${after}`;
}

export function touchAimLoupeX(pointer: Point, slotX: number, viewportWidth: number): number {
  return touchAimLoupeXForSide(slotX, touchAimLoupePreferredSide(pointer, slotX, viewportWidth), viewportWidth);
}

export function touchAimLoupePointerClearance(pointer: Point, rect: GameQaRect): number {
  const left = rect.x - rect.width / 2;
  const right = rect.x + rect.width / 2;
  const top = rect.y - rect.height / 2;
  const bottom = rect.y + rect.height / 2;
  const dx = Math.max(left - pointer.x, 0, pointer.x - right);
  const dy = Math.max(top - pointer.y, 0, pointer.y - bottom);

  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

function touchAimLoupePlacement(
  pointer: Point,
  slotX: number,
  viewport: { width: number; height: number },
  textTop: number,
  textBottom: number,
  compact: boolean
): { rect: GameQaRect; placement: Exclude<TouchAimLoupePlacement, "hidden"> } {
  const side = touchAimLoupePreferredSide(pointer, slotX, viewport.width);
  const flippedSide: -1 | 1 = side === 1 ? -1 : 1;
  const verticalOffset = compact ? 48 : 54;
  const candidates = [
    candidateLoupeRect(slotX, side, viewport, textTop - verticalOffset, "above"),
    candidateLoupeRect(slotX, flippedSide, viewport, textTop - verticalOffset, "above"),
    candidateLoupeRect(slotX, side, viewport, textBottom + verticalOffset, "below"),
    candidateLoupeRect(slotX, flippedSide, viewport, textBottom + verticalOffset, "below")
  ];

  const measured = candidates.map((candidate) => ({
    ...candidate,
    clearance: touchAimLoupePointerClearance(pointer, candidate.rect)
  }));

  return measured.find((candidate) => candidate.clearance >= TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE)
    ?? measured.sort((left, right) => right.clearance - left.clearance)[0];
}

function candidateLoupeRect(
  slotX: number,
  side: -1 | 1,
  viewport: { width: number; height: number },
  desiredY: number,
  placement: Exclude<TouchAimLoupePlacement, "hidden">
): { rect: GameQaRect; placement: Exclude<TouchAimLoupePlacement, "hidden"> } {
  const halfWidth = TOUCH_AIM_LOUPE_WIDTH / 2;
  const halfHeight = TOUCH_AIM_LOUPE_HEIGHT / 2;
  const margin = 10;

  return {
    placement,
    rect: {
      x: touchAimLoupeXForSide(slotX, side, viewport.width),
      y: clamp(desiredY, margin + halfHeight, viewport.height - margin - halfHeight),
      width: TOUCH_AIM_LOUPE_WIDTH,
      height: TOUCH_AIM_LOUPE_HEIGHT
    }
  };
}

function touchAimLoupePreferredSide(pointer: Point, slotX: number, viewportWidth: number): -1 | 1 {
  const pointerIsOnSlot = Math.abs(pointer.x - slotX) < 6;
  if (pointerIsOnSlot) {
    return pointer.x < viewportWidth / 2 ? 1 : -1;
  }

  return pointer.x > slotX ? -1 : 1;
}

function touchAimLoupeXForSide(slotX: number, side: -1 | 1, viewportWidth: number): number {
  const halfWidth = TOUCH_AIM_LOUPE_WIDTH / 2;
  const margin = 10;

  return clamp(
    slotX + side * TOUCH_AIM_LOUPE_POINTER_CLEARANCE,
    margin + halfWidth,
    viewportWidth - margin - halfWidth
  );
}

export function touchAimLoupeVisualStyle(snapReady: boolean): TouchAimLoupeVisualStyle {
  if (snapReady) {
    return {
      accentAlpha: 0.68,
      borderAlpha: 0.78,
      centerLineWidth: 1.65,
      centerLineAlpha: 0.78,
      railAlpha: 0.62,
      railHeight: 4,
      sideRailWidth: 5
    };
  }

  return {
    accentAlpha: 0.34,
    borderAlpha: 0.58,
    centerLineWidth: 1,
    centerLineAlpha: 0.38,
    railAlpha: 0.16,
    railHeight: 2,
    sideRailWidth: 4
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
