export type ResultsCopyState = "idle" | "copied" | "download" | "saved" | "unavailable";

export interface ResultsCopyAction {
  readonly lifecycleToken: number;
  readonly actionToken: number;
}

export class ResultsCopyActionGate {
  private lifecycleToken = 0;
  private actionSequence = 0;
  private activeAction: ResultsCopyAction | null = null;

  beginLifecycle(): void {
    this.lifecycleToken += 1;
    this.activeAction = null;
  }

  tryBegin(): ResultsCopyAction | null {
    if (this.activeAction) {
      return null;
    }

    this.actionSequence += 1;
    this.activeAction = {
      lifecycleToken: this.lifecycleToken,
      actionToken: this.actionSequence
    };
    return this.activeAction;
  }

  isCurrent(action: ResultsCopyAction): boolean {
    return this.lifecycleToken === action.lifecycleToken &&
      this.activeAction?.lifecycleToken === action.lifecycleToken &&
      this.activeAction.actionToken === action.actionToken;
  }

  finish(action: ResultsCopyAction): boolean {
    if (!this.isCurrent(action)) {
      return false;
    }

    this.activeAction = null;
    return true;
  }
}

export function copySummaryButtonLabel(state: ResultsCopyState): string {
  if (state === "copied") {
    return "Summary Copied";
  }
  if (state === "download") {
    return "Save Summary";
  }
  if (state === "saved") {
    return "Summary Saved";
  }
  if (state === "unavailable") {
    return "Use Ledger Text";
  }
  return "Copy Summary";
}
