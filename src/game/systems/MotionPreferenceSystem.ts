import { StorageSystem } from "./StorageSystem";

export const MOTION_PREFERENCE_REGISTRY_KEY = "motionPreferenceRuntime";
export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export interface MotionPreferenceSnapshot {
  reduced: boolean;
  supported: boolean;
}

export interface MotionTreatment {
  petIdle: "animate" | "still";
  petReaction: "animate" | "still";
  resolvedText: "fall" | "fade";
  cutImpact: "scale" | "fade";
}

interface MotionMediaQueryChange {
  matches: boolean;
}

interface MotionMediaQueryList {
  readonly matches: boolean;
  addEventListener?: (type: "change", listener: (event: MotionMediaQueryChange) => void) => void;
  removeEventListener?: (type: "change", listener: (event: MotionMediaQueryChange) => void) => void;
  addListener?: (listener: (event: MotionMediaQueryChange) => void) => void;
  removeListener?: (listener: (event: MotionMediaQueryChange) => void) => void;
}

export type MotionMatchMedia = (query: string) => MotionMediaQueryList;
export type MotionPreferenceListener = (snapshot: Readonly<MotionPreferenceSnapshot>) => void;

export interface MotionPreferenceRuntime {
  snapshot(): Readonly<MotionPreferenceSnapshot>;
  setReduced(reduced: boolean): Readonly<MotionPreferenceSnapshot>;
  subscribe(listener: MotionPreferenceListener): () => void;
  destroy(): void;
}

export function unsupportedMotionPreference(): Readonly<MotionPreferenceSnapshot> {
  return Object.freeze({ reduced: false, supported: false });
}

export function motionPreferenceLabel(snapshot: MotionPreferenceSnapshot): string {
  if (!snapshot.supported) {
    return "Reduced Motion: Unavailable";
  }

  return `Reduced Motion: ${snapshot.reduced ? "On" : "Off"}`;
}

export function motionTreatment(snapshot: MotionPreferenceSnapshot): MotionTreatment {
  if (!snapshot.reduced) {
    return {
      petIdle: "animate",
      petReaction: "animate",
      resolvedText: "fall",
      cutImpact: "scale"
    };
  }

  return {
    petIdle: "still",
    petReaction: "still",
    resolvedText: "fade",
    cutImpact: "fade"
  };
}

export function createMotionPreferenceRuntime(
  matchMedia: MotionMatchMedia | undefined = browserMatchMedia(),
  storage = new StorageSystem()
): MotionPreferenceRuntime {
  const listeners = new Set<MotionPreferenceListener>();
  let destroyed = false;
  let mediaQuery: MotionMediaQueryList | undefined;
  const stored = storage.loadMotionPreference();
  let override = stored.status === "stored" ? stored.reduced : undefined;
  const mayPersist = stored.status !== "future";

  try {
    mediaQuery = matchMedia?.(REDUCED_MOTION_MEDIA_QUERY);
  } catch {
    mediaQuery = undefined;
  }

  let current = frozenSnapshot(override ?? mediaQuery?.matches ?? false, true);

  const handleChange = (event: MotionMediaQueryChange): void => {
    if (destroyed || override !== undefined || current.reduced === Boolean(event.matches)) {
      return;
    }

    current = frozenSnapshot(event.matches, true);
    for (const listener of [...listeners]) {
      listener(current);
    }
  };

  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
  } else {
    mediaQuery?.addListener?.(handleChange);
  }

  return {
    snapshot: () => current,
    setReduced(reduced) {
      if (destroyed || current.reduced === Boolean(reduced)) {
        return current;
      }

      override = Boolean(reduced);
      if (mayPersist) {
        storage.saveMotionPreference(override);
      }
      current = frozenSnapshot(override, true);
      for (const listener of [...listeners]) {
        listener(current);
      }
      return current;
    },
    subscribe(listener) {
      if (destroyed) {
        return () => undefined;
      }

      listeners.add(listener);
      let subscribed = true;
      return () => {
        if (!subscribed) {
          return;
        }
        subscribed = false;
        listeners.delete(listener);
      };
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery?.removeListener?.(handleChange);
      }
      listeners.clear();
    }
  };
}

function browserMatchMedia(): MotionMatchMedia | undefined {
  if (typeof globalThis.matchMedia !== "function") {
    return undefined;
  }

  return globalThis.matchMedia.bind(globalThis) as MotionMatchMedia;
}

function frozenSnapshot(reduced: boolean, supported: boolean): Readonly<MotionPreferenceSnapshot> {
  return Object.freeze({ reduced: Boolean(reduced), supported });
}
