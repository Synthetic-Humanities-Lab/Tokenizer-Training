export function sceneClockNow(loopNow: number, sceneNow: number): number {
  if (Number.isFinite(loopNow) && loopNow > 0) {
    return loopNow;
  }

  if (Number.isFinite(sceneNow) && sceneNow > 0) {
    return sceneNow;
  }

  return 0;
}
