import { PointerActivationGuard } from "./PointerActivationGuard";

type EventListener = (...args: any[]) => void;

interface EventSource {
  on(event: string, listener: EventListener): unknown;
  once(event: string, listener: EventListener): unknown;
  off(event: string, listener: EventListener): unknown;
}

interface CanvasPointer {
  id: number;
  downTime: number;
  button: number;
  primaryDown: boolean;
  wasTouch: boolean;
  wasCanceled: boolean;
}

interface CanvasButtonActivationOptions {
  button: EventSource;
  input: EventSource;
  onRest: () => void;
  onHover: () => void;
  onPress: () => void;
  onActivate: () => void;
}

export function bindCanvasButtonActivation(options: CanvasButtonActivationOptions): () => void {
  const activation = new PointerActivationGuard();
  let disposed = false;

  const handlePointerOver = (pointer: CanvasPointer): void => {
    if (activation.isOwnedBy(pointer.id) || activation.isOwnedByAnother(pointer.id)) {
      return;
    }
    options.onHover();
  };
  const handlePointerOut = (pointer: CanvasPointer): void => {
    if (activation.isOwnedByAnother(pointer.id)) {
      return;
    }
    activation.cancel(pointer.id);
    options.onRest();
  };
  const handlePointerDown = (pointer: CanvasPointer): void => {
    if (!isPrimaryActivationPress(pointer)) {
      return;
    }
    if (activation.press(pointer.id, pointer.downTime)) {
      options.onPress();
    }
  };
  const handlePointerUp = (pointer: CanvasPointer): void => {
    if (!isPrimaryActivationRelease(pointer)) {
      return;
    }
    const release = activation.release(
      pointer.id,
      pointer.downTime,
      pointer.wasTouch && pointer.wasCanceled
    );
    if (release === "ignore") {
      return;
    }

    if (pointer.wasTouch || release === "cancel") {
      options.onRest();
    } else {
      options.onHover();
    }
    if (release === "activate") {
      options.onActivate();
    }
  };
  const handlePointerUpOutside = (pointer: CanvasPointer): void => {
    if (!isPrimaryActivationRelease(pointer)) {
      return;
    }
    if (activation.cancel(pointer.id)) {
      options.onRest();
    }
  };
  const handleGameOut = (): void => {
    activation.cancelAll();
    options.onRest();
  };

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    options.button.off("pointerover", handlePointerOver);
    options.button.off("pointerout", handlePointerOut);
    options.button.off("pointerdown", handlePointerDown);
    options.button.off("pointerup", handlePointerUp);
    options.button.off("destroy", dispose);
    options.input.off("pointerupoutside", handlePointerUpOutside);
    options.input.off("gameout", handleGameOut);
  };

  options.button.on("pointerover", handlePointerOver);
  options.button.on("pointerout", handlePointerOut);
  options.button.on("pointerdown", handlePointerDown);
  options.button.on("pointerup", handlePointerUp);
  options.button.once("destroy", dispose);
  options.input.on("pointerupoutside", handlePointerUpOutside);
  options.input.on("gameout", handleGameOut);

  return dispose;
}

function isPrimaryActivationPress(pointer: CanvasPointer): boolean {
  return pointer.wasTouch || (pointer.button === 0 && pointer.primaryDown);
}

function isPrimaryActivationRelease(pointer: CanvasPointer): boolean {
  return pointer.wasTouch || pointer.button === 0;
}
