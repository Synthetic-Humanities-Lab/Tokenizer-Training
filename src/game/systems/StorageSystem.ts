import { LEGACY_STORAGE_PREFIXES, STORAGE_PREFIX } from "./ProductIdentitySystem";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface HighScoreRecord {
  rounds: number;
  balance: number;
  accuracy: number;
  rank: string;
  rankScore?: number;
  costEfficiency?: number;
  totalPay?: number;
  totalCost?: number;
  updatedAt: string;
}

const HIGH_SCORE_KEY = `${STORAGE_PREFIX}.high-score`;
const MUTED_KEY = `${STORAGE_PREFIX}.muted`;
const LEGACY_HIGH_SCORE_KEYS = LEGACY_STORAGE_PREFIXES.map((prefix) => `${prefix}.high-score`);
const LEGACY_MUTED_KEYS = LEGACY_STORAGE_PREFIXES.map((prefix) => `${prefix}.muted`);
const HIGH_SCORE_KEYS = [HIGH_SCORE_KEY, ...LEGACY_HIGH_SCORE_KEYS];
const MUTED_KEYS = [MUTED_KEY, ...LEGACY_MUTED_KEYS];

export class StorageSystem {
  private readonly storage: StorageLike | undefined;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? getBrowserStorage();
  }

  loadHighScore(): HighScoreRecord | null {
    if (!this.storage) {
      return null;
    }

    try {
      const stored = readFirstStorageValue(this.storage, HIGH_SCORE_KEYS);
      if (!stored.raw) {
        return null;
      }

      const parsed = validatedHighScore(stored.raw);
      if (!parsed) {
        return null;
      }

      if (stored.key !== HIGH_SCORE_KEY && this.storage.getItem(HIGH_SCORE_KEY) === null) {
        this.storage.setItem(HIGH_SCORE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  }

  saveHighScore(candidate: Omit<HighScoreRecord, "updatedAt">): HighScoreRecord {
    const record: HighScoreRecord = {
      ...candidate,
      updatedAt: new Date().toISOString()
    };

    if (!this.storage) {
      return record;
    }

    const existing = this.loadHighScore();
    if (!existing || this.isBetter(record, existing)) {
      try {
        this.storage.setItem(HIGH_SCORE_KEY, JSON.stringify(record));
      } catch {
        return record;
      }
      return record;
    }

    return existing;
  }

  loadMuted(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      const canonical = this.storage.getItem(MUTED_KEY);
      if (canonical !== null) {
        return canonical === "true";
      }

      const legacy = readFirstStorageValue(this.storage, LEGACY_MUTED_KEYS);
      if (legacy.raw !== null) {
        this.storage.setItem(MUTED_KEY, legacy.raw === "true" ? "true" : "false");
      }

      return legacy.raw === "true";
    } catch {
      return false;
    }
  }

  saveMuted(muted: boolean): void {
    try {
      this.storage?.setItem(MUTED_KEY, muted ? "true" : "false");
    } catch {
      // Storage is optional; sound state still changes for the current session.
    }
  }

  clearPlaytestState(): void {
    if (!this.storage) {
      return;
    }

    try {
      if (this.storage.removeItem) {
        this.storage.removeItem(HIGH_SCORE_KEY);
        this.storage.removeItem(MUTED_KEY);
        LEGACY_HIGH_SCORE_KEYS.forEach((key) => this.storage?.removeItem?.(key));
        LEGACY_MUTED_KEYS.forEach((key) => this.storage?.removeItem?.(key));
        return;
      }

      HIGH_SCORE_KEYS.forEach((key) => this.storage?.setItem(key, ""));
      MUTED_KEYS.forEach((key) => this.storage?.setItem(key, "false"));
    } catch {
      // Reset links should not block boot when storage is unavailable.
    }
  }

  private isBetter(candidate: HighScoreRecord, existing: HighScoreRecord): boolean {
    const candidateRankScore = this.comparableRankScore(candidate);
    const existingRankScore = this.comparableRankScore(existing);
    if (Math.abs(candidateRankScore - existingRankScore) > 0.01) {
      return candidateRankScore > existingRankScore;
    }

    if (candidate.rounds !== existing.rounds) {
      return candidate.rounds > existing.rounds;
    }

    if (candidate.accuracy !== existing.accuracy) {
      return candidate.accuracy > existing.accuracy;
    }

    const candidateEfficiency = candidate.costEfficiency ?? 0;
    const existingEfficiency = existing.costEfficiency ?? 0;
    if (candidateEfficiency !== existingEfficiency) {
      return candidateEfficiency > existingEfficiency;
    }

    return candidate.balance > existing.balance;
  }

  private comparableRankScore(record: HighScoreRecord): number {
    return record.rankScore ?? record.rounds * 10 + record.accuracy * 35 + Math.max(0, record.balance) * 0.15;
  }
}

function readFirstStorageValue(storage: StorageLike, keys: string[]): { key: string; raw: string | null } {
  for (const key of keys) {
    const raw = storage.getItem(key);
    if (raw !== null) {
      return { key, raw };
    }
  }

  return { key: keys[0] ?? "", raw: null };
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function validatedHighScore(raw: string): HighScoreRecord | null {
  const parsed = JSON.parse(raw) as HighScoreRecord;
  if (
    !Number.isFinite(parsed.rounds) ||
    !Number.isFinite(parsed.balance) ||
    !Number.isFinite(parsed.accuracy) ||
    typeof parsed.rank !== "string"
  ) {
    return null;
  }

  return parsed;
}
