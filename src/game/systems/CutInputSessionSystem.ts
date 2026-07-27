import { graphemeLength, splitGraphemes } from "./GraphemeSystem";
import {
  SwipeCutSystem,
  type BoundaryBounds,
  type BoundarySlot,
  type Point
} from "./SwipeCutSystem";

export interface CutInputSample {
  bounds: BoundaryBounds;
  currentCuts: number[];
  lastPoint?: Point;
  point: Point;
  text: string;
  viewportWidth: number;
  hinted?: boolean;
  spaceRunAssist?: boolean;
  playableSlots?: BoundarySlot[];
}

export interface CutInputResult {
  cuts: number[];
  addedCuts: number[];
  removedCuts: number[];
  replacedCuts: number[];
  lastPoint: Point;
}

interface CutCandidateSet {
  currentCuts: number[];
  candidates: number[];
  replacedCuts: number[];
}

export class CutInputSessionSystem {
  private readonly gestureCuts = new Set<number>();
  private readonly spaceRunGestureLocks = new Set<number>();
  private gestureStartPoint?: Point;

  constructor(private readonly swipe = new SwipeCutSystem()) {}

  applySample(input: CutInputSample): CutInputResult {
    const spaceRunAssist = input.spaceRunAssist ?? true;
    const playableSlots = input.playableSlots ?? this.swipe.buildPlayableSlots(input.bounds, input.text, input.hinted ?? false);
    const slots = spaceRunAssist
      ? this.spaceRunAssistedSlots(playableSlots, input.bounds, input.text)
      : playableSlots;
    const snapDistance = this.swipe.snapDistanceForViewport(input.viewportWidth);
    const existingCuts = new Set(input.currentCuts);
    this.gestureStartPoint ??= input.lastPoint ?? input.point;
    if (spaceRunAssist) {
      this.rememberOrdinarySpaceRunLock(input, slots, snapDistance, existingCuts);
    }
    const nearestBoundary = this.swipe.nearestBoundary(slots, input.point, snapDistance);
    const protectedNearestBoundary = !spaceRunAssist || nearestBoundary === null
      ? null
      : this.spaceRunProtectedCandidate(nearestBoundary, input, slots, snapDistance, existingCuts);
    const nearestCandidate = spaceRunAssist
      ? protectedNearestBoundary !== null && existingCuts.has(protectedNearestBoundary) ? null : protectedNearestBoundary
      : nearestBoundary !== null && existingCuts.has(nearestBoundary) ? null : nearestBoundary;
    const crossedBoundaries = input.lastPoint
      ? this.localGestureCandidates(
          this.candidateBoundariesForSample(input, slots, snapDistance, existingCuts, spaceRunAssist)
            .filter((cut) => !existingCuts.has(cut)),
          input,
          slots,
          snapDistance,
          nearestCandidate
        )
      : [];
    const boundary = spaceRunAssist && crossedBoundaries.length > 0 && !isPreSpaceRunBoundary(input.text, nearestCandidate)
      ? null
      : nearestCandidate;
    const rawCandidates = uniqueCandidates(
      [...crossedBoundaries, boundary].filter((candidate): candidate is number => candidate !== null)
    );
    const assistedCandidates = spaceRunAssist
      ? this.spaceRunGestureCandidates(input.currentCuts, rawCandidates, input.text)
      : { currentCuts: input.currentCuts, candidates: rawCandidates, replacedCuts: [] };
    const candidateCuts = this.localGestureReplacementCandidates(
      assistedCandidates,
      input,
      slots,
      snapDistance
    );
    const cuts = this.swipe.addCuts(
      spaceRunAssist ? this.spaceRunLockedCurrentCuts(candidateCuts.currentCuts, input.text) : candidateCuts.currentCuts,
      candidateCuts.candidates,
      graphemeLength(input.text)
    );
    const addedCuts = cuts.filter((cut) => !existingCuts.has(cut));
    const removedCuts = input.currentCuts.filter((cut) => !cuts.includes(cut));
    addedCuts.forEach((cut) => this.gestureCuts.add(cut));

    return {
      cuts,
      addedCuts,
      removedCuts,
      replacedCuts: candidateCuts.replacedCuts,
      lastPoint: input.point
    };
  }

  endGesture(): undefined {
    this.gestureCuts.clear();
    this.spaceRunGestureLocks.clear();
    this.gestureStartPoint = undefined;
    return undefined;
  }

  private spaceRunAssistedSlots(
    slots: BoundarySlot[],
    bounds: BoundaryBounds,
    text: string
  ): BoundarySlot[] {
    const graphemes = splitGraphemes(text);
    const graphemeWidth = graphemes.length > 0 ? bounds.width / graphemes.length : 0;

    return slots.flatMap((slot) => {
      if (graphemes[slot.index - 1] === " ") {
        return [];
      }

      if (graphemes[slot.index] !== " ") {
        return [slot];
      }

      let runLength = 0;
      for (
        let index = slot.index;
        index < graphemes.length && graphemes[index] === graphemes[slot.index];
        index += 1
      ) {
        runLength += 1;
      }

      return [{
        ...slot,
        x: bounds.left + graphemeWidth * (slot.index + runLength / 2)
      }];
    });
  }

  private candidateBoundariesForSample(
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number,
    existingCuts: Set<number>,
    spaceRunAssist: boolean
  ): number[] {
    const crossed = this.swipe.boundariesCrossedBySegment(slots, input.lastPoint!, input.point, snapDistance);

    if (!spaceRunAssist) {
      return crossed;
    }

    return this.swipe.collapseSpaceRunGestureDuplicates(
      this.spaceRunProtectedCandidates(crossed, input, slots, snapDistance, existingCuts),
      input.text
    );
  }

  private localGestureCandidates(
    candidates: number[],
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number,
    nearestCandidate: number | null
  ): number[] {
    if (!input.lastPoint || candidates.length !== 2) {
      return candidates;
    }

    const uniqueCandidates = [...new Set(candidates)];
    if (uniqueCandidates.length !== 2) {
      return candidates;
    }

    const candidateSlots = uniqueCandidates
      .map((candidate) => slots.find((slot) => slot.index === candidate))
      .filter((slot): slot is BoundaryBoundsSlot => slot !== undefined);
    if (candidateSlots.length !== uniqueCandidates.length) {
      return candidates;
    }

    const slotXs = candidateSlots.map((slot) => slot.x);
    const slotSpan = Math.max(...slotXs) - Math.min(...slotXs);
    if (slotSpan <= 0) {
      return candidates;
    }

    const gestureSpan = Math.abs(input.point.x - input.lastPoint.x);
    if (gestureSpan > localGestureLimit(slotSpan, snapDistance)) {
      return candidates;
    }

    if (nearestCandidate !== null && uniqueCandidates.includes(nearestCandidate)) {
      return [nearestCandidate];
    }

    return [closestCandidateToPoint(uniqueCandidates, candidateSlots, input.point.x)];
  }

  private localGestureReplacementCandidates(
    candidateCuts: CutCandidateSet,
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number
  ): CutCandidateSet {
    if (!this.gestureStartPoint || candidateCuts.candidates.length !== 1) {
      return candidateCuts;
    }

    const candidate = candidateCuts.candidates[0];
    if (this.gestureCuts.has(candidate)) {
      return candidateCuts;
    }

    const candidateSlotIndex = slots.findIndex((slot) => slot.index === candidate);
    if (candidateSlotIndex < 0) {
      return candidateCuts;
    }

    const replaceableCuts = candidateCuts.currentCuts.filter((cut) => {
      if (!this.gestureCuts.has(cut)) {
        return false;
      }

      const cutSlotIndex = slots.findIndex((slot) => slot.index === cut);
      return cutSlotIndex >= 0 && Math.abs(cutSlotIndex - candidateSlotIndex) === 1;
    });
    if (replaceableCuts.length !== 1) {
      return candidateCuts;
    }

    const replaceableCut = replaceableCuts[0];
    const replaceableSlot = slots.find((slot) => slot.index === replaceableCut);
    const candidateSlot = slots[candidateSlotIndex];
    if (!replaceableSlot) {
      return candidateCuts;
    }

    const slotSpan = Math.abs(candidateSlot.x - replaceableSlot.x);
    const gestureSpan = Math.abs(input.point.x - this.gestureStartPoint.x);
    if (slotSpan <= 0 || gestureSpan > localGestureLimit(slotSpan, snapDistance)) {
      return candidateCuts;
    }

    this.gestureCuts.delete(replaceableCut);

    return {
      currentCuts: candidateCuts.currentCuts.filter((cut) => cut !== replaceableCut),
      candidates: candidateCuts.candidates,
      replacedCuts: [...candidateCuts.replacedCuts, replaceableCut]
    };
  }

  private rememberOrdinarySpaceRunLock(
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number,
    existingCuts: Set<number>
  ): void {
    const graphemes = splitGraphemes(input.text);

    for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
      const startsSpaceRun = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
      if (!startsSpaceRun || !existingCuts.has(boundary)) {
        continue;
      }

      let firstNonSpaceAfterRun = boundary;
      while (graphemes[firstNonSpaceAfterRun] === " ") {
        firstNonSpaceAfterRun += 1;
      }

      if (!isLetterGrapheme(graphemes[firstNonSpaceAfterRun])) {
        continue;
      }

      const preSpaceSlot = slots.find((slot) => slot.index === boundary);
      if (!preSpaceSlot) {
        continue;
      }

      const lockDistance = snapDistance
        + spaceRunProtectionPadding(input.viewportWidth)
        + ordinaryWordOvershootPadding(input);
      const pointStartedInsideLock =
        input.lastPoint !== undefined && Math.abs(input.lastPoint.x - preSpaceSlot.x) <= lockDistance;
      const pointInsideLock = Math.abs(input.point.x - preSpaceSlot.x) <= lockDistance;

      if (pointStartedInsideLock || pointInsideLock) {
        this.spaceRunGestureLocks.add(boundary);
      }
    }
  }

  private spaceRunGestureCandidates(
    currentCuts: number[],
    candidates: number[],
    text: string
  ): CutCandidateSet {
    if (candidates.length === 0) {
      return { currentCuts, candidates, replacedCuts: [] };
    }

    const graphemes = splitGraphemes(text);
    const candidateSet = new Set(candidates);
    const suppressedCandidates = new Set<number>();
    const removedCurrentCuts = new Set<number>();

    for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
      const startsSpaceRun = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
      if (!startsSpaceRun) {
        continue;
      }

      let firstNonSpaceAfterRun = boundary;
      while (graphemes[firstNonSpaceAfterRun] === " ") {
        firstNonSpaceAfterRun += 1;
      }

      const preSpaceInGesture = this.gestureCuts.has(boundary) || candidateSet.has(boundary);
      const followingWordBoundaries = followingWordBoundaryIndexes(graphemes, firstNonSpaceAfterRun);
      const firstFollowingWordBoundary = followingWordBoundaries[0];
      const postSpaceOvershootInGesture = followingWordBoundaries.some(
        (followingWordBoundary) =>
          this.gestureCuts.has(followingWordBoundary) || candidateSet.has(followingWordBoundary)
      );
      if (!preSpaceInGesture || !postSpaceOvershootInGesture) {
        continue;
      }

      if (firstFollowingWordBoundary !== undefined && candidateSet.has(firstFollowingWordBoundary)) {
        suppressedCandidates.add(firstFollowingWordBoundary);
      }

      if (candidateSet.has(boundary)) {
        for (const followingWordBoundary of followingWordBoundaries) {
          if (this.gestureCuts.has(followingWordBoundary)) {
            removedCurrentCuts.add(followingWordBoundary);
            this.gestureCuts.delete(followingWordBoundary);
          }
        }
      }
    }

    return {
      currentCuts: currentCuts.filter((cut) => !removedCurrentCuts.has(cut)),
      candidates: candidates.filter((cut) => !suppressedCandidates.has(cut)),
      replacedCuts: []
    };
  }

  private spaceRunLockedCurrentCuts(currentCuts: number[], text: string): number[] {
    if (this.spaceRunGestureLocks.size === 0) {
      return currentCuts;
    }

    const currentCutSet = new Set(currentCuts);
    const graphemes = splitGraphemes(text);
    const removedCurrentCuts = new Set<number>();

    for (const preSpaceBoundary of this.spaceRunGestureLocks) {
      if (!currentCutSet.has(preSpaceBoundary)) {
        continue;
      }

      let firstNonSpaceAfterRun = preSpaceBoundary;
      while (graphemes[firstNonSpaceAfterRun] === " ") {
        firstNonSpaceAfterRun += 1;
      }

      if (!isLetterGrapheme(graphemes[firstNonSpaceAfterRun])) {
        continue;
      }

      for (const followingWordBoundary of followingWordBoundaryIndexes(graphemes, firstNonSpaceAfterRun)) {
        if (currentCutSet.has(followingWordBoundary)) {
          removedCurrentCuts.add(followingWordBoundary);
        }
      }
    }

    return currentCuts.filter((cut) => !removedCurrentCuts.has(cut));
  }

  private spaceRunProtectedCandidates(
    candidates: number[],
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number,
    existingCuts: Set<number>
  ): number[] {
    return candidates.flatMap((candidate) => {
      const protectedCandidate = this.spaceRunProtectedCandidate(
        candidate,
        input,
        slots,
        snapDistance,
        existingCuts
      );

      return protectedCandidate === null ? [] : [protectedCandidate];
    });
  }

  private spaceRunProtectedCandidate(
    candidate: number,
    input: CutInputSample,
    slots: BoundaryBoundsSlot[],
    snapDistance: number,
    existingCuts: Set<number>
  ): number | null {
    const preSpaceBoundary = preSpaceBoundaryForFollowingWord(input.text, candidate);
    if (preSpaceBoundary === null) {
      return candidate;
    }

    if (this.spaceRunGestureLocks.has(preSpaceBoundary)) {
      return null;
    }

    const preSpaceSlot = slots.find((slot) => slot.index === preSpaceBoundary);
    if (!preSpaceSlot) {
      return candidate;
    }

    if (this.gestureCuts.has(preSpaceBoundary)) {
      return null;
    }

    if (existingCuts.has(preSpaceBoundary) && isOrdinaryFollowingWordBoundary(input.text, candidate)) {
      return null;
    }

    const protectionDistance = snapDistance + spaceRunProtectionPadding(input.viewportWidth);
    const pointDistanceFromSpace = Math.abs(input.point.x - preSpaceSlot.x);
    const wordLockDistance = protectionDistance + ordinaryWordOvershootPadding(input);
    const ordinaryFirstWordOvershoot = isOrdinaryFirstFollowingWordBoundary(input.text, candidate);
    const segmentStartedInOrdinaryWordLock =
      ordinaryFirstWordOvershoot &&
      input.lastPoint !== undefined &&
      Math.abs(input.lastPoint.x - preSpaceSlot.x) <= wordLockDistance;

    if (
      existingCuts.has(preSpaceBoundary) &&
      ordinaryFirstWordOvershoot &&
      (pointDistanceFromSpace <= wordLockDistance || segmentStartedInOrdinaryWordLock)
    ) {
      return null;
    }

    const candidateSlot = slots.find((slot) => slot.index === candidate);
    const clearlyCloserToCandidate = candidateSlot
      ? Math.abs(input.point.x - candidateSlot.x) + candidateIntentMargin(input.viewportWidth) < pointDistanceFromSpace
      : false;
    const pointNearSpaceRun = pointDistanceFromSpace <= protectionDistance && !clearlyCloserToCandidate;
    const segmentStartedNearSpaceRun =
      input.lastPoint !== undefined &&
      Math.abs(input.lastPoint.x - preSpaceSlot.x) <= protectionDistance;

    if (!pointNearSpaceRun && !segmentStartedNearSpaceRun) {
      return candidate;
    }

    return existingCuts.has(preSpaceBoundary) ? null : preSpaceBoundary;
  }
}

function isPreSpaceRunBoundary(text: string, boundary: number | null): boundary is number {
  if (boundary === null) {
    return false;
  }

  const graphemes = splitGraphemes(text);
  return boundary > 0 && boundary < graphemes.length && graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
}

function followingWordBoundaryIndexes(graphemes: string[], firstNonSpaceAfterRun: number): number[] {
  const boundaries: number[] = [];

  for (let boundary = firstNonSpaceAfterRun + 1; boundary < graphemes.length; boundary += 1) {
    if (graphemes[boundary] === " ") {
      break;
    }

    if (isLetterGrapheme(graphemes[boundary - 1]) && isLetterGrapheme(graphemes[boundary])) {
      boundaries.push(boundary);
    }
  }

  return boundaries;
}

type BoundaryBoundsSlot = ReturnType<SwipeCutSystem["buildPlayableSlots"]>[number];

function preSpaceBoundaryForFollowingWord(text: string, candidate: number): number | null {
  const graphemes = splitGraphemes(text);

  for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
    const startsSpaceRun = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
    if (!startsSpaceRun) {
      continue;
    }

    let firstNonSpaceAfterRun = boundary;
    while (graphemes[firstNonSpaceAfterRun] === " ") {
      firstNonSpaceAfterRun += 1;
    }

    if (followingWordBoundaryIndexes(graphemes, firstNonSpaceAfterRun).includes(candidate)) {
      return boundary;
    }
  }

  return null;
}

function isOrdinaryFirstFollowingWordBoundary(text: string, candidate: number): boolean {
  const graphemes = splitGraphemes(text);

  for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
    const startsSpaceRun = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
    if (!startsSpaceRun) {
      continue;
    }

    let firstNonSpaceAfterRun = boundary;
    while (graphemes[firstNonSpaceAfterRun] === " ") {
      firstNonSpaceAfterRun += 1;
    }

    if (!isLetterGrapheme(graphemes[firstNonSpaceAfterRun])) {
      continue;
    }

    if (candidate === firstNonSpaceAfterRun + 1) {
      return true;
    }
  }

  return false;
}

function isOrdinaryFollowingWordBoundary(text: string, candidate: number): boolean {
  const graphemes = splitGraphemes(text);

  for (let boundary = 1; boundary < graphemes.length; boundary += 1) {
    const startsSpaceRun = graphemes[boundary] === " " && graphemes[boundary - 1] !== " ";
    if (!startsSpaceRun) {
      continue;
    }

    let firstNonSpaceAfterRun = boundary;
    while (graphemes[firstNonSpaceAfterRun] === " ") {
      firstNonSpaceAfterRun += 1;
    }

    if (!isLetterGrapheme(graphemes[firstNonSpaceAfterRun])) {
      continue;
    }

    if (followingWordBoundaryIndexes(graphemes, firstNonSpaceAfterRun).includes(candidate)) {
      return true;
    }
  }

  return false;
}

function spaceRunProtectionPadding(viewportWidth: number): number {
  return viewportWidth < 760 ? 8 : 4;
}

function candidateIntentMargin(viewportWidth: number): number {
  return viewportWidth < 760 ? 10 : 6;
}

function closestCandidateToPoint(candidates: number[], slots: BoundaryBoundsSlot[], x: number): number {
  let closest = candidates[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < candidates.length; index += 1) {
    const slot = slots[index];
    const distance = Math.abs(x - slot.x);
    if (distance < closestDistance) {
      closest = candidates[index];
      closestDistance = distance;
    }
  }

  return closest;
}

function localGestureLimit(slotSpan: number, snapDistance: number): number {
  return Math.max(slotSpan * 2.05, snapDistance * 2.2);
}

function uniqueCandidates(candidates: number[]): number[] {
  return [...new Set(candidates)];
}

function ordinaryWordOvershootPadding(input: CutInputSample): number {
  const graphemeCount = Math.max(1, graphemeLength(input.text));
  const graphemeWidth = input.bounds.width / graphemeCount;

  return Math.max(8, Math.min(36, graphemeWidth * 1.1));
}

function isLetterGrapheme(value: string | undefined): boolean {
  return value !== undefined && /^\p{L}\p{M}*$/u.test(value.normalize("NFD"));
}
