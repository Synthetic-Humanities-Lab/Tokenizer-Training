const CUT_UNDO_HISTORY_LIMIT = 32;

export class CutUndoSystem {
  private history: number[][] = [];
  private gestureStartCuts?: number[];

  beginGesture(currentCuts: readonly number[]): void {
    if (this.gestureStartCuts) {
      return;
    }

    this.gestureStartCuts = [...currentCuts];
  }

  completeGesture(currentCuts: readonly number[]): boolean {
    const previousCuts = this.gestureStartCuts;
    this.gestureStartCuts = undefined;
    if (!previousCuts || cutsEqual(previousCuts, currentCuts)) {
      return false;
    }

    this.history = [...this.history, previousCuts].slice(-CUT_UNDO_HISTORY_LIMIT);
    return true;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): number[] | undefined {
    this.gestureStartCuts = undefined;
    const previousCuts = this.history.pop();
    return previousCuts ? [...previousCuts] : undefined;
  }

  clear(): void {
    this.history = [];
    this.gestureStartCuts = undefined;
  }
}

function cutsEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((cut, index) => cut === right[index]);
}
