import { SemanticRuntimeCoordinator } from "./SemanticCoordinator";
import { SemanticDomSurface } from "./SemanticDomSurface";
import type { SemanticRuntime } from "./SemanticTypes";

export type {
  SemanticAction,
  SemanticAlertDialog,
  SemanticAnnouncement,
  SemanticButtonControl,
  SemanticContentGroup,
  SemanticControl,
  SemanticLease,
  SemanticOrderedMapping,
  SemanticRuntime,
  SemanticSceneId,
  SemanticSnapshot,
  SemanticStatusControl,
  SemanticSwitchControl
} from "./SemanticTypes";

export const SEMANTIC_RUNTIME_REGISTRY_KEY = "tokenizer-training.semantic-runtime";

interface SemanticRuntimeRegistry {
  get(key: string): unknown;
}

function isSemanticRuntime(value: unknown): value is SemanticRuntime {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<SemanticRuntime>;
  return (
    typeof candidate.mount === "function" &&
    typeof candidate.ownsKeyboardEvent === "function" &&
    typeof candidate.destroy === "function"
  );
}

export function createSemanticRuntime(parent: string | HTMLElement): SemanticRuntime {
  return new SemanticRuntimeCoordinator(new SemanticDomSurface(parent));
}

export function readSemanticRuntime(registry: SemanticRuntimeRegistry): SemanticRuntime | undefined {
  const runtime = registry.get(SEMANTIC_RUNTIME_REGISTRY_KEY);
  return isSemanticRuntime(runtime) ? runtime : undefined;
}
