export type PlayControlId = "resolve" | "clear" | "mute" | "exit";

export interface PlayInputPointer {
  id: number;
  downTime: number;
  button: number;
  primaryDown: boolean;
  wasTouch: boolean;
  wasCanceled: boolean;
}

export type PlayControlRelease = "activate" | "cancel" | "ignore";

export type PlayInputOwner =
  | {
      kind: "slice";
      pointerId: number;
      gestureId: number;
    }
  | {
      kind: "control";
      pointerId: number;
      gestureId: number;
      controlId: PlayControlId;
      armed: boolean;
    };

export class PlayInputRoutingSystem {
  private owner?: PlayInputOwner;

  beginSlice(pointer: PlayInputPointer): boolean {
    if (this.ownsSlice(pointer)) {
      return true;
    }
    if (this.owner || !isPrimaryPress(pointer)) {
      return false;
    }

    this.owner = {
      kind: "slice",
      pointerId: pointer.id,
      gestureId: pointer.downTime
    };
    return true;
  }

  continueSlice(pointer: PlayInputPointer): boolean {
    return this.ownsSlice(pointer);
  }

  beginControl(controlId: PlayControlId, pointer: PlayInputPointer): boolean {
    if (this.owner || !isPrimaryPress(pointer)) {
      return false;
    }

    this.owner = {
      kind: "control",
      pointerId: pointer.id,
      gestureId: pointer.downTime,
      controlId,
      armed: true
    };
    return true;
  }

  ownsSlice(pointer: PlayInputPointer): boolean {
    return this.owner?.kind === "slice" && matchesPointer(this.owner, pointer);
  }

  ownsControl(controlId: PlayControlId, pointer: PlayInputPointer): boolean {
    return this.owner?.kind === "control" &&
      this.owner.controlId === controlId &&
      matchesPointer(this.owner, pointer);
  }

  ownsPointer(pointer: PlayInputPointer): boolean {
    return this.owner !== undefined && matchesPointer(this.owner, pointer);
  }

  hasOwner(): boolean {
    return this.owner !== undefined;
  }

  cancelControl(controlId: PlayControlId, pointer: PlayInputPointer): boolean {
    if (!this.ownsControl(controlId, pointer) || this.owner?.kind !== "control") {
      return false;
    }

    this.owner.armed = false;
    return true;
  }

  releaseControl(controlId: PlayControlId, pointer: PlayInputPointer): PlayControlRelease {
    if (!isPrimaryRelease(pointer) || !this.ownsControl(controlId, pointer) || this.owner?.kind !== "control") {
      return "ignore";
    }

    const shouldActivate = this.owner.armed && !(pointer.wasTouch && pointer.wasCanceled);
    this.owner = undefined;
    return shouldActivate ? "activate" : "cancel";
  }

  endPointer(pointer: PlayInputPointer): PlayInputOwner | undefined {
    if (!isPrimaryRelease(pointer) || !this.owner || !matchesPointer(this.owner, pointer)) {
      return undefined;
    }

    return this.takeOwner();
  }

  cancelAll(): PlayInputOwner | undefined {
    return this.takeOwner();
  }

  private takeOwner(): PlayInputOwner | undefined {
    const owner = this.owner;
    this.owner = undefined;
    return owner;
  }
}

function matchesPointer(owner: PlayInputOwner, pointer: PlayInputPointer): boolean {
  return owner.pointerId === pointer.id && owner.gestureId === pointer.downTime;
}

function isPrimaryPress(pointer: PlayInputPointer): boolean {
  return pointer.wasTouch || (pointer.button === 0 && pointer.primaryDown);
}

function isPrimaryRelease(pointer: PlayInputPointer): boolean {
  return pointer.wasTouch || pointer.button === 0;
}
