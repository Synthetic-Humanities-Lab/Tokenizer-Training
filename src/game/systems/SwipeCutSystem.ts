import { splitGraphemes } from "./GraphemeSystem";

export interface Point {
  x: number;
  y: number;
}

export interface BoundarySlot {
  index: number;
  x: number;
  yMin: number;
  yMax: number;
  hinted: boolean;
}

export interface BoundaryBounds {
  left: number;
  top: number;
  bottom: number;
  width: number;
}

const DESKTOP_SNAP_DISTANCE = 20;
const TOUCH_SNAP_DISTANCE = 26;
const PREVIEW_EXTRA_DISTANCE = 12;
const COMPACT_VIEWPORT_WIDTH = 760;

export class SwipeCutSystem {
  nearestBoundarySlot(
    slots: BoundarySlot[],
    point: Point,
    snapDistance = 18
  ): BoundarySlot | null {
    let best: BoundarySlot | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const slot of slots) {
      if (point.y < slot.yMin || point.y > slot.yMax) {
        continue;
      }

      const distance = Math.abs(point.x - slot.x);
      if (distance < bestDistance) {
        best = slot;
        bestDistance = distance;
      }
    }

    if (!best || bestDistance > snapDistance) {
      return null;
    }

    return best;
  }

  nearestBoundary(
    slots: BoundarySlot[],
    point: Point,
    snapDistance = 18
  ): number | null {
    return this.nearestBoundarySlot(slots, point, snapDistance)?.index ?? null;
  }

  pointInsideCutBand(slots: BoundarySlot[], point: Point): boolean {
    return slots.some((slot) => point.y >= slot.yMin && point.y <= slot.yMax);
  }

  snapDistanceForViewport(width: number): number {
    return width < COMPACT_VIEWPORT_WIDTH ? TOUCH_SNAP_DISTANCE : DESKTOP_SNAP_DISTANCE;
  }

  previewDistanceForViewport(width: number): number {
    return this.snapDistanceForViewport(width) + PREVIEW_EXTRA_DISTANCE;
  }

  nearestPreviewSlot(
    slots: BoundarySlot[],
    point: Point,
    currentCuts: number[],
    viewportWidth: number
  ): BoundarySlot | null {
    const stagedCuts = new Set(currentCuts);
    return this.nearestBoundarySlot(
      slots.filter((slot) => !stagedCuts.has(slot.index)),
      point,
      this.previewDistanceForViewport(viewportWidth)
    );
  }

  addCut(cuts: number[], boundary: number | null, maxBoundary: number): number[] {
    if (boundary === null || boundary <= 0 || boundary >= maxBoundary) {
      return [...cuts].sort((a, b) => a - b);
    }

    return [...new Set([...cuts, boundary])].sort((a, b) => a - b);
  }

  addCuts(cuts: number[], boundaries: Array<number | null>, maxBoundary: number): number[] {
    return boundaries.reduce(
      (updatedCuts, boundary) => this.addCut(updatedCuts, boundary, maxBoundary),
      cuts
    );
  }

  boundariesCrossedBySegment(
    slots: BoundarySlot[],
    start: Point,
    end: Point,
    snapDistance = 0
  ): number[] {
    const dx = end.x - start.x;
    const yMin = Math.min(start.y, end.y);
    const yMax = Math.max(start.y, end.y);
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const candidates = slots
      .map((slot) => {
        if (dx === 0) {
          return {
            slot,
            t: 0,
            crossed: Math.abs(start.x - slot.x) <= snapDistance && rangesOverlap(yMin, yMax, slot.yMin, slot.yMax),
            exact: false,
            distance: Math.abs(start.x - slot.x)
          };
        }

        const t = (slot.x - start.x) / dx;
        const y = start.y + (end.y - start.y) * t;
        const crossedExactly = t >= 0 && t <= 1 && y >= slot.yMin && y <= slot.yMax;
        const crossedNear = !crossedExactly &&
          snapDistance > 0 &&
          rangesOverlap(yMin, yMax, slot.yMin, slot.yMax) &&
          distanceToRange(slot.x, xMin, xMax) <= snapDistance;

        return {
          slot,
          t: Math.max(0, Math.min(1, t)),
          crossed: crossedExactly || crossedNear,
          exact: crossedExactly,
          distance: distanceToRange(slot.x, xMin, xMax)
        };
      })
      .filter(({ crossed }) => crossed);

    const exact = candidates.filter((candidate) => candidate.exact);
    if (exact.length > 0) {
      return exact
        .sort((a, b) => a.t - b.t || a.distance - b.distance)
        .map(({ slot }) => slot.index);
    }

    const near = candidates.filter((candidate) => !candidate.exact);
    const nearestNear = nearestCandidate(near);

    return [
      ...exact,
      ...(nearestNear ? [nearestNear] : [])
    ]
      .sort((a, b) => a.t - b.t || a.distance - b.distance)
      .map(({ slot }) => slot.index);
  }

  buildMonospaceSlots(bounds: BoundaryBounds, displayLength: number): BoundarySlot[] {
    if (displayLength < 2 || bounds.width <= 0) {
      return [];
    }

    const characterWidth = bounds.width / displayLength;
    const slots: BoundarySlot[] = [];

    for (let index = 1; index < displayLength; index += 1) {
      slots.push({
        index,
        x: bounds.left + characterWidth * index,
        yMin: bounds.top - 22,
        yMax: bounds.bottom + 22,
        hinted: false
      });
    }

    return slots;
  }

  buildTokenBoundarySlots(
    bounds: BoundaryBounds,
    textOrDisplayLength: string | number,
    boundaryPositions: number[],
    hinted = false
  ): BoundarySlot[] {
    let graphemes: string[] | undefined;
    let displayLength: number;
    if (typeof textOrDisplayLength === "string") {
      graphemes = splitGraphemes(textOrDisplayLength);
      displayLength = graphemes.length;
    } else {
      displayLength = textOrDisplayLength;
    }
    if (displayLength < 2 || bounds.width <= 0) {
      return [];
    }

    const characterWidth = bounds.width / displayLength;
    return [...new Set(boundaryPositions)]
      .filter((boundary) => Number.isInteger(boundary) && boundary > 0 && boundary < displayLength)
      .sort((a, b) => a - b)
      .map((boundary) => ({
        index: boundary,
        x: graphemes
          ? bounds.left + characterWidth * this.visualBoundaryOffset(graphemes, boundary)
          : bounds.left + characterWidth * boundary,
        yMin: bounds.top - 28,
        yMax: bounds.bottom + 28,
        hinted
      }));
  }

  buildPlayableSlots(bounds: BoundaryBounds, text: string, hinted = false): BoundarySlot[] {
    const graphemes = splitGraphemes(text);
    const displayLength = graphemes.length;
    if (displayLength < 2 || bounds.width <= 0) {
      return [];
    }

    const slots: BoundarySlot[] = [];

    for (let index = 1; index < displayLength; index += 1) {
      if (graphemes[index - 1] === " ") {
        continue;
      }

      const x = this.boundaryXFromGraphemes(bounds, graphemes, index);
      if (x === null) {
        continue;
      }

      slots.push({
        index,
        x,
        yMin: bounds.top - 28,
        yMax: bounds.bottom + 28,
        hinted
      });
    }

    return slots;
  }

  boundaryX(bounds: BoundaryBounds, text: string, boundary: number): number | null {
    return this.boundaryXFromGraphemes(bounds, splitGraphemes(text), boundary);
  }

  unplayableBoundaries(boundaryPositions: number[], text: string): number[] {
    const playable = new Set(this.playableBoundaryIndexes(text));
    return [...new Set(boundaryPositions)]
      .filter((boundary) => !playable.has(boundary))
      .sort((a, b) => a - b);
  }

  hasAdjacentSpaceDuplicates(boundaryPositions: number[], text: string): boolean {
    const boundaries = new Set(boundaryPositions);
    const graphemes = splitGraphemes(text);

    for (let index = 0; index < graphemes.length; index += 1) {
      if (graphemes[index] === " " && boundaries.has(index) && boundaries.has(index + 1)) {
        return true;
      }
    }

    return false;
  }

  collapseSpaceRunGestureDuplicates(boundaryPositions: number[], text: string): number[] {
    if (boundaryPositions.length < 2) {
      return boundaryPositions;
    }

    const boundaries = new Set(boundaryPositions);
    const graphemes = splitGraphemes(text);
    const suppressed = new Set<number>();

    for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
      const isPreSpaceBoundary = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
      if (!isPreSpaceBoundary || !boundaries.has(boundary)) {
        continue;
      }

      let firstNonSpaceAfterRun = boundary;
      while (graphemes[firstNonSpaceAfterRun] === " ") {
        firstNonSpaceAfterRun += 1;
      }

      for (const followingWordBoundary of followingWordBoundariesAfterSpaceRun(graphemes, firstNonSpaceAfterRun)) {
        if (boundaries.has(followingWordBoundary)) {
          suppressed.add(followingWordBoundary);
        }
      }
    }

    return boundaryPositions.filter((boundary) => !suppressed.has(boundary));
  }

  private playableBoundaryIndexes(text: string): number[] {
    const graphemes = splitGraphemes(text);
    return Array.from({ length: Math.max(0, graphemes.length - 1) }, (_, index) => index + 1)
      .filter((index) => graphemes[index - 1] !== " ");
  }

  private boundaryXFromGraphemes(bounds: BoundaryBounds, graphemes: string[], boundary: number): number | null {
    if (graphemes.length < 2 || bounds.width <= 0 || boundary <= 0 || boundary >= graphemes.length) {
      return null;
    }

    const graphemeWidth = bounds.width / graphemes.length;
    return bounds.left + graphemeWidth * this.visualBoundaryOffset(graphemes, boundary);
  }

  private visualBoundaryOffset(graphemes: string[], boundary: number): number {
    if (graphemes[boundary] !== " ") {
      return boundary;
    }

    let runLength = 0;
    for (let index = boundary; index < graphemes.length && graphemes[index] === " "; index += 1) {
      runLength += 1;
    }

    return boundary + runLength / 2;
  }
}

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return aMin <= bMax && bMin <= aMax;
}

function distanceToRange(value: number, min: number, max: number): number {
  if (value < min) {
    return min - value;
  }

  if (value > max) {
    return value - max;
  }

  return 0;
}

function nearestCandidate<T extends { distance: number; slot: BoundarySlot }>(candidates: T[]): T | undefined {
  return candidates.reduce<T | undefined>((nearest, candidate) => {
    if (!nearest || candidate.distance < nearest.distance || (
      candidate.distance === nearest.distance && candidate.slot.index < nearest.slot.index
    )) {
      return candidate;
    }

    return nearest;
  }, undefined);
}

function followingWordBoundariesAfterSpaceRun(graphemes: string[], firstNonSpaceAfterRun: number): number[] {
  const boundaries: number[] = [];

  for (let boundary = firstNonSpaceAfterRun + 1; boundary < graphemes.length; boundary += 1) {
    if (graphemes[boundary] === " ") {
      break;
    }

    boundaries.push(boundary);
  }

  return boundaries;
}
