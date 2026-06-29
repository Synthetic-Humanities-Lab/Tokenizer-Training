import linesJson from "../data/wiener_speech_lines.json";
import type { RoundScoreResult } from "./ScoringSystem";
import type { TokenFixture } from "./TokenizerSystem";

export type WienerSpeechScene = "menu" | "tutorial" | "play" | "economy" | "results" | "system";
export type WienerSpeechDelivery = "bubble" | "panel";
export type WienerSpeechTargetLength = "short" | "medium";
export type LegacyWienerSpeechAlias = "good" | "missed" | "falseCut" | "overcut" | "lowBalance" | "bad";

export interface WienerSpeechLinesV2 {
  schema_version: 2;
  persona: {
    id: string;
    display_name: string;
    company: string;
    surface: string;
    world_year: number;
    interface_era: number;
    description: string;
    selection_policy: {
      repeat_window: number;
      max_same_category_in_row: number;
      prefer_short_lines_during_active_play: boolean;
      suppress_nonessential_barks_during_swipe: boolean;
    };
  };
  categories: Record<string, WienerSpeechCategory>;
}

export interface WienerSpeechCategory {
  scene: WienerSpeechScene;
  delivery: WienerSpeechDelivery;
  target_length: WienerSpeechTargetLength;
  cooldown_group: string;
  lines: string[];
}

export interface WienerSpeechPickOptions {
  seed?: number;
  index?: number;
  remember?: boolean;
}

export interface WienerSpeechRoundStartContext {
  balance: number;
  fixture?: TokenFixture;
}

export const WIENER_SPEECH_EMERGENCY_LINE = "WIENER copy route missing. Continue boundary work.";
export const WIENER_SPEECH_RECORD_MISSING_CATEGORY = "system.record_missing";

const lowBalanceThreshold = 10;
const denseCategories = new Set(["url", "email", "filename", "code", "hashtag", "tokenizer_string"]);

const legacyAliasCategories: Record<LegacyWienerSpeechAlias, string[]> = {
  good: ["play.resolve.perfect", "play.resolve.good"],
  missed: ["play.resolve.missed"],
  falseCut: ["play.resolve.false_cut"],
  overcut: ["play.resolve.overcut"],
  lowBalance: ["economy.balance_warning", "play.round_start.low_balance"],
  bad: ["play.resolve.mixed"]
};

const validScenes = new Set<WienerSpeechScene>(["menu", "tutorial", "play", "economy", "results", "system"]);
const validDeliveries = new Set<WienerSpeechDelivery>(["bubble", "panel"]);
const validTargetLengths = new Set<WienerSpeechTargetLength>(["short", "medium"]);

export class WienerSpeechLineSystem {
  private readonly schema: WienerSpeechLinesV2;
  private readonly recentLines: string[] = [];
  private readonly repeatWindow: number;
  private pickCount = 0;

  constructor(schema: unknown = linesJson) {
    this.schema = validateWienerSpeechLinesV2(schema);
    this.repeatWindow = Math.max(0, Math.floor(this.schema.persona.selection_policy.repeat_window));
  }

  pick(category: string, options: WienerSpeechPickOptions = {}): string {
    const resolvedCategory = this.resolveCategory(category);
    const pool = this.selectPool(resolvedCategory);
    const selected = pool[this.pickIndex(pool, options)] ?? WIENER_SPEECH_EMERGENCY_LINE;

    if (options.remember !== false) {
      this.rememberLine(selected);
    }

    return selected;
  }

  pickLegacy(alias: LegacyWienerSpeechAlias, options: WienerSpeechPickOptions = {}): string {
    return this.pick(this.resolveLegacyCategory(alias), options);
  }

  categoryForRoundStart(context: WienerSpeechRoundStartContext): string {
    if (Number.isFinite(context.balance) && context.balance <= lowBalanceThreshold) {
      return "play.round_start.low_balance";
    }

    if (context.fixture && denseCategories.has(context.fixture.category)) {
      return "play.round_start.dense_string";
    }

    return "play.round_start.neutral";
  }

  pickForRoundStart(context: WienerSpeechRoundStartContext, options: WienerSpeechPickOptions = {}): string {
    return this.pick(this.categoryForRoundStart(context), options);
  }

  categoryForResolve(score: RoundScoreResult): string {
    if (score.missedCuts.length === 0 && score.falseCuts.length === 0) {
      return "play.resolve.perfect";
    }

    if (score.falseCuts.length >= 3 && score.falseCuts.length > score.missedCuts.length) {
      return "play.resolve.overcut";
    }

    if (score.missedCuts.length > 0 && score.falseCuts.length === 0) {
      return "play.resolve.missed";
    }

    if (score.falseCuts.length > 0 && score.missedCuts.length === 0) {
      return "play.resolve.false_cut";
    }

    return "play.resolve.mixed";
  }

  pickForResolve(score: RoundScoreResult, options: WienerSpeechPickOptions = {}): string {
    return this.pick(this.categoryForResolve(score), options);
  }

  hasCategory(category: string): boolean {
    return this.schema.categories[category]?.lines.length > 0;
  }

  private resolveLegacyCategory(alias: LegacyWienerSpeechAlias): string {
    for (const category of legacyAliasCategories[alias]) {
      if (this.hasCategory(category)) {
        return category;
      }
    }

    return WIENER_SPEECH_RECORD_MISSING_CATEGORY;
  }

  private resolveCategory(category: string): string {
    if (this.hasCategory(category)) {
      return category;
    }

    if (this.hasCategory(WIENER_SPEECH_RECORD_MISSING_CATEGORY)) {
      return WIENER_SPEECH_RECORD_MISSING_CATEGORY;
    }

    return "";
  }

  private selectPool(category: string): string[] {
    if (!category) {
      return [WIENER_SPEECH_EMERGENCY_LINE];
    }

    const lines = this.schema.categories[category]?.lines.filter((line) => line.trim().length > 0) ?? [];
    return lines.length > 0 ? lines : [WIENER_SPEECH_EMERGENCY_LINE];
  }

  private pickIndex(pool: string[], options: WienerSpeechPickOptions): number {
    if (pool.length <= 1) {
      return 0;
    }

    const rawIndex = options.index ?? options.seed ?? this.pickCount;
    this.pickCount += 1;
    const start = positiveModulo(rawIndex, pool.length);
    for (let offset = 0; offset < pool.length; offset += 1) {
      const index = (start + offset) % pool.length;
      if (!this.recentLines.includes(pool[index])) {
        return index;
      }
    }

    return start;
  }

  private rememberLine(line: string): void {
    if (this.repeatWindow <= 0) {
      return;
    }

    this.recentLines.push(line);
    while (this.recentLines.length > this.repeatWindow) {
      this.recentLines.shift();
    }
  }
}

export function validateWienerSpeechLinesV2(schema: unknown): WienerSpeechLinesV2 {
  if (!isRecord(schema)) {
    throw new Error("Wiener speech lines schema must be an object.");
  }

  if (schema.schema_version !== 2) {
    throw new Error("Wiener speech lines schema_version must be 2.");
  }

  if (!isRecord(schema.persona)) {
    throw new Error("Wiener speech lines persona must be an object.");
  }

  if (!isRecord(schema.persona.selection_policy)) {
    throw new Error("Wiener speech lines persona.selection_policy must be an object.");
  }

  const repeatWindow = schema.persona.selection_policy.repeat_window;
  if (!Number.isFinite(repeatWindow)) {
    throw new Error("Wiener speech lines repeat_window must be numeric.");
  }

  if (!Number.isFinite(schema.persona.selection_policy.max_same_category_in_row)) {
    throw new Error("Wiener speech lines max_same_category_in_row must be numeric.");
  }

  if (!isRecord(schema.categories)) {
    throw new Error("Wiener speech lines categories must be an object.");
  }

  for (const [key, category] of Object.entries(schema.categories)) {
    if (!isRecord(category)) {
      throw new Error(`Wiener speech category ${key} must be an object.`);
    }

    if (!validScenes.has(category.scene as WienerSpeechScene)) {
      throw new Error(`Wiener speech category ${key} has invalid scene.`);
    }

    if (!validDeliveries.has(category.delivery as WienerSpeechDelivery)) {
      throw new Error(`Wiener speech category ${key} has invalid delivery.`);
    }

    if (!validTargetLengths.has(category.target_length as WienerSpeechTargetLength)) {
      throw new Error(`Wiener speech category ${key} has invalid target_length.`);
    }

    if (typeof category.cooldown_group !== "string" || category.cooldown_group.trim().length === 0) {
      throw new Error(`Wiener speech category ${key} must define cooldown_group.`);
    }

    if (!Array.isArray(category.lines) || category.lines.length === 0) {
      throw new Error(`Wiener speech category ${key} must define at least one line.`);
    }

    if (category.lines.some((line) => typeof line !== "string" || line.trim().length === 0)) {
      throw new Error(`Wiener speech category ${key} contains an empty line.`);
    }
  }

  return schema as unknown as WienerSpeechLinesV2;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveModulo(value: number, divisor: number): number {
  if (!Number.isFinite(value) || divisor <= 0) {
    return 0;
  }

  return ((Math.floor(value) % divisor) + divisor) % divisor;
}
