export type PointerReleaseResult = "activate" | "cancel" | "ignore";

export class PointerActivationGuard {
  private armedGesture: { pointerId: number; gestureId: number } | null = null;

  press(pointerId: number, gestureId: number): boolean {
    if (this.armedGesture !== null && this.armedGesture.pointerId !== pointerId) {
      return false;
    }
    if (this.armedGesture?.gestureId === gestureId) {
      return false;
    }

    this.armedGesture = { pointerId, gestureId };
    return true;
  }

  isOwnedByAnother(pointerId: number): boolean {
    return this.armedGesture !== null && this.armedGesture.pointerId !== pointerId;
  }

  isOwnedBy(pointerId: number): boolean {
    return this.armedGesture?.pointerId === pointerId;
  }

  cancel(pointerId: number): boolean {
    if (this.armedGesture?.pointerId !== pointerId) {
      return false;
    }

    this.armedGesture = null;
    return true;
  }

  cancelAll(): boolean {
    const hadOwner = this.armedGesture !== null;
    this.armedGesture = null;
    return hadOwner;
  }

  release(pointerId: number, gestureId: number, wasCanceled = false): PointerReleaseResult {
    if (this.armedGesture?.pointerId !== pointerId) {
      return "ignore";
    }

    const shouldActivate = this.armedGesture.gestureId === gestureId && !wasCanceled;
    this.armedGesture = null;
    return shouldActivate ? "activate" : "cancel";
  }
}
