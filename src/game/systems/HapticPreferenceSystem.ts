import {
  StorageSystem,
  type HapticPreferenceLoadResult
} from "./StorageSystem";

export const HAPTIC_PREFERENCE_REGISTRY_KEY = "hapticPreferenceRuntime";

export type HapticPreferenceSource =
  | "stored"
  | "migrated"
  | "recovered"
  | "future"
  | "unavailable"
  | "session";

export interface HapticPreferenceSnapshot {
  enabled: boolean;
  persisted: boolean;
  source: HapticPreferenceSource;
}

export interface HapticPreferenceRuntime {
  snapshot(routeAvailable: boolean): Readonly<HapticPreferenceSnapshot>;
  setEnabled(enabled: boolean): Readonly<HapticPreferenceSnapshot>;
}

interface HapticPreferenceRegistry {
  get(key: string): unknown;
}

export class StoredHapticPreferenceRuntime implements HapticPreferenceRuntime {
  private current?: HapticPreferenceSnapshot;
  private initialStatus?: HapticPreferenceLoadResult["status"];

  constructor(private readonly storage = new StorageSystem()) {}

  snapshot(routeAvailable: boolean): Readonly<HapticPreferenceSnapshot> {
    if (!this.current) {
      this.initialize(routeAvailable);
    } else if (
      routeAvailable
      && this.initialStatus === "missing"
      && !this.current.persisted
    ) {
      this.current = this.persist(this.current.enabled, "migrated");
    }

    return { ...this.current! };
  }

  setEnabled(enabled: boolean): Readonly<HapticPreferenceSnapshot> {
    this.snapshot(true);

    if (this.initialStatus === "future") {
      this.current = { enabled, persisted: false, source: "session" };
      return { ...this.current };
    }

    this.current = this.persist(enabled, "stored");
    return { ...this.current };
  }

  private initialize(routeAvailable: boolean): void {
    const stored = this.storage.loadHapticPreference();
    this.initialStatus = stored.status;

    if (stored.status === "stored") {
      this.current = { enabled: stored.enabled, persisted: true, source: "stored" };
      return;
    }

    if (stored.status === "future") {
      this.current = { enabled: false, persisted: false, source: "future" };
      return;
    }

    const enabled = !this.storage.loadMuted();
    if (stored.status === "missing" && routeAvailable) {
      this.current = this.persist(enabled, "migrated");
      return;
    }

    this.current = {
      enabled,
      persisted: false,
      source: stored.status === "recoverable" ? "recovered" : "unavailable"
    };
  }

  private persist(enabled: boolean, successSource: HapticPreferenceSource): HapticPreferenceSnapshot {
    const persisted = this.storage.saveHapticPreference(enabled);
    return {
      enabled,
      persisted,
      source: persisted ? successSource : "unavailable"
    };
  }
}

export function createHapticPreferenceRuntime(storage?: StorageSystem): HapticPreferenceRuntime {
  return new StoredHapticPreferenceRuntime(storage);
}

export function readHapticPreferenceRuntime(registry: HapticPreferenceRegistry): HapticPreferenceRuntime | undefined {
  const runtime = registry.get(HAPTIC_PREFERENCE_REGISTRY_KEY) as Partial<HapticPreferenceRuntime> | undefined;
  return runtime
    && typeof runtime.snapshot === "function"
    && typeof runtime.setEnabled === "function"
    ? runtime as HapticPreferenceRuntime
    : undefined;
}
