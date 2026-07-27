import {
  PlayInputRoutingSystem,
  type PlayControlId,
  type PlayInputPointer
} from "./PlayInputRoutingSystem";

type EventListener = (...args: any[]) => void;

interface EventSource {
  on(event: string, listener: EventListener): unknown;
  once(event: string, listener: EventListener): unknown;
  off(event: string, listener: EventListener): unknown;
}

interface PlayControlActivationOptions {
  controlId: PlayControlId;
  button: EventSource;
  router: PlayInputRoutingSystem;
  onRest: () => void;
  onHover: () => void;
  onPress: () => void;
  onActivate: () => void;
}

export function bindPlayControlActivation(options: PlayControlActivationOptions): () => void {
  let disposed = false;

  const handlePointerOver = (pointer: PlayInputPointer): void => {
    if (options.router.ownsControl(options.controlId, pointer) || options.router.hasOwner()) {
      return;
    }
    options.onHover();
  };
  const handlePointerOut = (pointer: PlayInputPointer): void => {
    if (options.router.cancelControl(options.controlId, pointer)) {
      options.onRest();
      return;
    }
    if (!options.router.hasOwner()) {
      options.onRest();
    }
  };
  const handlePointerDown = (pointer: PlayInputPointer): void => {
    if (options.router.beginControl(options.controlId, pointer)) {
      options.onPress();
    }
  };
  const handlePointerUp = (pointer: PlayInputPointer): void => {
    const release = options.router.releaseControl(options.controlId, pointer);
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
  };

  options.button.on("pointerover", handlePointerOver);
  options.button.on("pointerout", handlePointerOut);
  options.button.on("pointerdown", handlePointerDown);
  options.button.on("pointerup", handlePointerUp);
  options.button.once("destroy", dispose);

  return dispose;
}
