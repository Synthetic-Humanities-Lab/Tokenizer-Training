import { LEGACY_STORAGE_PREFIXES, STORAGE_PREFIX } from "./ProductIdentitySystem";
import { rankForRounds, rankOrdinal } from "./RankSystem";

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

export type HighScoreSaveStatus = "saved" | "kept" | "unavailable";

export type HighScoreSaveResult =
  | {
      status: "saved" | "kept";
      achieved: HighScoreRecord;
      persisted: HighScoreRecord;
    }
  | {
      status: "unavailable";
      achieved: HighScoreRecord;
      persisted: HighScoreRecord | null;
    };

export type HighScoreClearResult =
  | { status: "cleared" | "already-clear"; persisted: null }
  | { status: "unavailable"; persisted: HighScoreRecord | null };

export type StorageQaState = Record<string, string | number | boolean | null>;

export type HapticPreferenceLoadResult =
  | { status: "stored"; enabled: boolean }
  | { status: "missing" | "recoverable" | "future" | "unavailable"; enabled: null };

export type MotionPreferenceLoadResult =
  | { status: "stored"; reduced: boolean }
  | { status: "missing" | "recoverable" | "future" | "unavailable"; reduced: null };

export interface TokenLogSentenceObservation {
  fixtureId: string;
  text: string;
  successful: boolean;
  tokenStrings: string[];
  tokenIds: number[];
}

export interface TokenLogSentenceRecord {
  id: string;
  text: string;
  fixtureIds: string[];
  attempts: number;
  successfulAttempts: number;
  lastSuccessful: boolean;
  tokenStrings: string[];
  tokenIds: number[];
}

export interface TrainingFixtureProgress {
  fixtureId: string;
  passed: boolean;
  resolvedAt: number;
}

export interface TrainingProgressRecord {
  resolvedCount: number;
  fixtures: TrainingFixtureProgress[];
}

const HIGH_SCORE_KEY = `${STORAGE_PREFIX}.high-score`;
const MUTED_KEY = `${STORAGE_PREFIX}.muted`;
const HAPTIC_PREFERENCE_KEY = `${STORAGE_PREFIX}.haptics-preference`;
const HAPTIC_PREFERENCE_VERSION = 1;
const HAPTIC_PREFERENCE_MAX_RAW_CODE_UNITS = 128;
const MOTION_PREFERENCE_KEY = `${STORAGE_PREFIX}.reduced-motion-preference`;
const MOTION_PREFERENCE_VERSION = 1;
const MOTION_PREFERENCE_MAX_RAW_CODE_UNITS = 128;
const TOKEN_LOG_KEY = `${STORAGE_PREFIX}.recent-token-log`;
const TOKEN_LOG_VERSION = 4;
const LEGACY_TOKEN_LOG_VERSION = 3;
const TOKEN_LOG_SENTENCE_LIMIT = 512;
const TOKEN_LOG_FIXTURE_LIMIT = 32;
const TOKEN_LOG_TOKEN_LIMIT = 64;
const TOKEN_LOG_MAX_RAW_CODE_UNITS = 262144;
const TOKEN_LOG_TEXT_MAX_CODE_UNITS = 256;
const TOKEN_LOG_FIXTURE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const TRAINING_PROGRESS_KEY = `${STORAGE_PREFIX}.training-progress`;
const TRAINING_PROGRESS_VERSION = 1;
const TRAINING_PROGRESS_FIXTURE_LIMIT = 512;
const TUTORIAL_QUALIFICATION_KEY = `${STORAGE_PREFIX}.tutorial-qualification`;
const TUTORIAL_QUALIFICATION_VERSION = 1;
const LEGACY_HIGH_SCORE_KEYS = LEGACY_STORAGE_PREFIXES.map((prefix) => `${prefix}.high-score`);
const LEGACY_MUTED_KEYS = LEGACY_STORAGE_PREFIXES.map((prefix) => `${prefix}.muted`);
const HIGH_SCORE_KEYS = [HIGH_SCORE_KEY, ...LEGACY_HIGH_SCORE_KEYS];
const MUTED_KEYS = [MUTED_KEY, ...LEGACY_MUTED_KEYS];

interface TokenLogRecord {
  version: typeof TOKEN_LOG_VERSION;
  sentences: TokenLogSentenceRecord[];
}

interface HapticPreferenceRecord {
  version: typeof HAPTIC_PREFERENCE_VERSION;
  enabled: boolean;
}

interface MotionPreferenceRecord {
  version: typeof MOTION_PREFERENCE_VERSION;
  reduced: boolean;
}

interface StoredTrainingProgressRecord {
  version: typeof TRAINING_PROGRESS_VERSION;
  resolvedCount: number;
  fixtures: TrainingFixtureProgress[];
}

interface TutorialQualificationRecord {
  version: typeof TUTORIAL_QUALIFICATION_VERSION;
  qualified: true;
}

type TokenLogReadResult =
  | { status: "current"; sentences: TokenLogSentenceRecord[] }
  | { status: "future"; sentences: [] }
  | { status: "recoverable"; sentences: [] };

interface HighScoreStorageRead {
  readable: boolean;
  raw: string | null;
}

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
      const stored = readFirstValidHighScore(this.storage, HIGH_SCORE_KEYS);
      if (!stored) {
        return null;
      }

      if (stored.key !== HIGH_SCORE_KEY) {
        try {
          const canonicalRaw = this.storage.getItem(HIGH_SCORE_KEY);
          if (!canonicalRaw || !validatedHighScore(canonicalRaw)) {
            this.storage.setItem(HIGH_SCORE_KEY, JSON.stringify(stored.record));
          }
        } catch {
          // A readable legacy score remains usable when canonical migration fails.
        }
      }
      return stored.record;
    } catch {
      return null;
    }
  }

  saveHighScore(candidate: Omit<HighScoreRecord, "updatedAt">): HighScoreSaveResult {
    const record: HighScoreRecord = {
      ...candidate,
      updatedAt: new Date().toISOString()
    };

    if (!this.storage) {
      return { status: "unavailable", achieved: record, persisted: null };
    }

    const existing = this.loadHighScore();
    if (existing && !this.isBetter(record, existing)) {
      return { status: "kept", achieved: existing, persisted: existing };
    }

    try {
      this.storage.setItem(HIGH_SCORE_KEY, JSON.stringify(record));
    } catch {
      return { status: "unavailable", achieved: record, persisted: existing };
    }

    return { status: "saved", achieved: record, persisted: record };
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

  loadHapticPreference(): HapticPreferenceLoadResult {
    if (!this.storage) {
      return { status: "unavailable", enabled: null };
    }

    try {
      return readHapticPreferenceRecord(this.storage.getItem(HAPTIC_PREFERENCE_KEY));
    } catch {
      return { status: "unavailable", enabled: null };
    }
  }

  saveHapticPreference(enabled: boolean): boolean {
    if (!this.storage) {
      return false;
    }

    const record: HapticPreferenceRecord = {
      version: HAPTIC_PREFERENCE_VERSION,
      enabled
    };

    try {
      this.storage.setItem(HAPTIC_PREFERENCE_KEY, JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }

  loadMotionPreference(): MotionPreferenceLoadResult {
    if (!this.storage) {
      return { status: "unavailable", reduced: null };
    }

    try {
      return readMotionPreferenceRecord(this.storage.getItem(MOTION_PREFERENCE_KEY));
    } catch {
      return { status: "unavailable", reduced: null };
    }
  }

  saveMotionPreference(reduced: boolean): boolean {
    if (!this.storage) {
      return false;
    }

    const record: MotionPreferenceRecord = {
      version: MOTION_PREFERENCE_VERSION,
      reduced
    };

    try {
      this.storage.setItem(MOTION_PREFERENCE_KEY, JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }

  loadTokenLogSentences(): TokenLogSentenceRecord[] {
    if (!this.storage) {
      return [];
    }

    try {
      return readTokenLogRecord(this.storage.getItem(TOKEN_LOG_KEY)).sentences;
    } catch {
      return [];
    }
  }

  rememberTokenLogSentences(observations: readonly TokenLogSentenceObservation[]): void {
    if (!this.storage || observations.length === 0) {
      return;
    }

    try {
      const stored = readTokenLogRecord(this.storage.getItem(TOKEN_LOG_KEY));
      if (stored.status === "future") {
        return;
      }

      const sentences = mergeTokenLogObservations(stored.sentences, observations);
      const record: TokenLogRecord = {
        version: TOKEN_LOG_VERSION,
        sentences
      };
      this.storage.setItem(TOKEN_LOG_KEY, JSON.stringify(record));
    } catch {
      // Resolution and review must continue when local storage is unavailable.
    }
  }

  clearTokenLog(): void {
    if (!this.storage) {
      return;
    }

    try {
      if (this.storage.removeItem) {
        this.storage.removeItem(TOKEN_LOG_KEY);
        return;
      }

      this.storage.setItem(TOKEN_LOG_KEY, "");
    } catch {
      // Token Log remains non-blocking when storage fails.
    }
  }

  loadTrainingProgress(): TrainingProgressRecord {
    if (!this.storage) {
      return emptyTrainingProgress();
    }

    try {
      return readTrainingProgress(this.storage.getItem(TRAINING_PROGRESS_KEY));
    } catch {
      return emptyTrainingProgress();
    }
  }

  saveTrainingProgress(progress: TrainingProgressRecord): boolean {
    if (!this.storage) {
      return false;
    }

    const validated = validTrainingProgress(progress);
    const record: StoredTrainingProgressRecord = {
      version: TRAINING_PROGRESS_VERSION,
      ...validated
    };

    try {
      this.storage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }

  loadTutorialQualified(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      const raw = this.storage.getItem(TUTORIAL_QUALIFICATION_KEY);
      if (!raw) {
        return false;
      }
      const parsed: unknown = JSON.parse(raw);
      return isRecord(parsed)
        && parsed.version === TUTORIAL_QUALIFICATION_VERSION
        && parsed.qualified === true;
    } catch {
      return false;
    }
  }

  saveTutorialQualified(): boolean {
    if (!this.storage) {
      return false;
    }

    const record: TutorialQualificationRecord = {
      version: TUTORIAL_QUALIFICATION_VERSION,
      qualified: true
    };
    try {
      this.storage.setItem(TUTORIAL_QUALIFICATION_KEY, JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }

  clearHighScore(): HighScoreClearResult {
    const storage = this.storage;
    if (!storage) {
      return { status: "unavailable", persisted: null };
    }

    const before = readHighScoreValues(storage);
    const wasAlreadyClear = areHighScoreValuesClear(before);

    if (!wasAlreadyClear) {
      for (const key of HIGH_SCORE_KEYS) {
        try {
          if (storage.removeItem) {
            storage.removeItem(key);
          } else {
            storage.setItem(key, "");
          }
        } catch {
          // Continue so readback can expose partial deletion rather than hiding it.
        }
      }
    }

    const after = readHighScoreValues(storage);
    const persisted = persistedHighScore(after);
    if (!areHighScoreValuesReadable(before) || !areHighScoreValuesClear(after)) {
      return { status: "unavailable", persisted };
    }

    return {
      status: wasAlreadyClear ? "already-clear" : "cleared",
      persisted: null
    };
  }

  clearPlaytestState(): void {
    if (!this.storage) {
      return;
    }

    try {
      if (this.storage.removeItem) {
        this.storage.removeItem(HIGH_SCORE_KEY);
        this.storage.removeItem(MUTED_KEY);
        this.storage.removeItem(HAPTIC_PREFERENCE_KEY);
        this.storage.removeItem(MOTION_PREFERENCE_KEY);
        this.storage.removeItem(TOKEN_LOG_KEY);
        this.storage.removeItem(TRAINING_PROGRESS_KEY);
        this.storage.removeItem(TUTORIAL_QUALIFICATION_KEY);
        LEGACY_HIGH_SCORE_KEYS.forEach((key) => this.storage?.removeItem?.(key));
        LEGACY_MUTED_KEYS.forEach((key) => this.storage?.removeItem?.(key));
        return;
      }

      HIGH_SCORE_KEYS.forEach((key) => this.storage?.setItem(key, ""));
      MUTED_KEYS.forEach((key) => this.storage?.setItem(key, "false"));
      this.storage.setItem(HAPTIC_PREFERENCE_KEY, "");
      this.storage.setItem(MOTION_PREFERENCE_KEY, "");
      this.storage.setItem(TOKEN_LOG_KEY, "");
      this.storage.setItem(TRAINING_PROGRESS_KEY, "");
      this.storage.setItem(TUTORIAL_QUALIFICATION_KEY, "");
    } catch {
      // Reset links should not block boot when storage is unavailable.
    }
  }

  qaState(): StorageQaState {
    const state: StorageQaState = {
      storageAvailable: this.storage !== undefined,
      highScoreStorageKey: HIGH_SCORE_KEY,
      mutedStorageKey: MUTED_KEY,
      hapticPreferenceStorageKey: HAPTIC_PREFERENCE_KEY,
      motionPreferenceStorageKey: MOTION_PREFERENCE_KEY,
      trainingProgressStorageKey: TRAINING_PROGRESS_KEY,
      tutorialQualificationStorageKey: TUTORIAL_QUALIFICATION_KEY,
      highScoreRaw: null,
      mutedRaw: null,
      hapticPreferenceRaw: null,
      motionPreferenceRaw: null,
      trainingProgressRaw: null,
      tutorialQualificationRaw: null,
      highScorePresent: false,
      mutedPresent: false,
      hapticPreferencePresent: false,
      motionPreferencePresent: false,
      trainingProgressPresent: false,
      tutorialQualificationPresent: false,
      legacyHighScorePresent: false,
      legacyMutedPresent: false
    };

    if (!this.storage) {
      return state;
    }

    try {
      const highScoreRaw = this.storage.getItem(HIGH_SCORE_KEY);
      const mutedRaw = this.storage.getItem(MUTED_KEY);
      const hapticPreferenceRaw = this.storage.getItem(HAPTIC_PREFERENCE_KEY);
      const motionPreferenceRaw = this.storage.getItem(MOTION_PREFERENCE_KEY);
      const trainingProgressRaw = this.storage.getItem(TRAINING_PROGRESS_KEY);
      const tutorialQualificationRaw = this.storage.getItem(TUTORIAL_QUALIFICATION_KEY);
      state.highScoreRaw = highScoreRaw;
      state.mutedRaw = mutedRaw;
      state.hapticPreferenceRaw = hapticPreferenceRaw;
      state.motionPreferenceRaw = motionPreferenceRaw;
      state.trainingProgressRaw = trainingProgressRaw;
      state.tutorialQualificationRaw = tutorialQualificationRaw;
      state.highScorePresent = highScoreRaw !== null;
      state.mutedPresent = mutedRaw !== null;
      state.hapticPreferencePresent = hapticPreferenceRaw !== null;
      state.motionPreferencePresent = motionPreferenceRaw !== null;
      state.trainingProgressPresent = trainingProgressRaw !== null;
      state.tutorialQualificationPresent = tutorialQualificationRaw !== null;
      state.legacyHighScorePresent = LEGACY_HIGH_SCORE_KEYS.some((key) => this.storage?.getItem(key) !== null);
      state.legacyMutedPresent = LEGACY_MUTED_KEYS.some((key) => this.storage?.getItem(key) !== null);
    } catch {
      state.storageAvailable = false;
    }

    return state;
  }

  private isBetter(candidate: HighScoreRecord, existing: HighScoreRecord): boolean {
    const candidateRank = rankOrdinal(rankForRounds(candidate.rounds));
    const existingRank = rankOrdinal(rankForRounds(existing.rounds));
    if (candidateRank !== existingRank) {
      return candidateRank > existingRank;
    }

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
    return Math.max(0, Math.floor(record.rounds));
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

function readFirstValidHighScore(
  storage: StorageLike,
  keys: readonly string[]
): { key: string; record: HighScoreRecord } | null {
  for (const key of keys) {
    const raw = storage.getItem(key);
    if (!raw) {
      continue;
    }

    const record = validatedHighScore(raw);
    if (record) {
      return { key, record };
    }
  }

  return null;
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function readHighScoreValues(storage: StorageLike): HighScoreStorageRead[] {
  return HIGH_SCORE_KEYS.map((key) => {
    try {
      return { readable: true, raw: storage.getItem(key) };
    } catch {
      return { readable: false, raw: null };
    }
  });
}

function areHighScoreValuesReadable(reads: HighScoreStorageRead[]): boolean {
  return reads.every((read) => read.readable);
}

function areHighScoreValuesClear(reads: HighScoreStorageRead[]): boolean {
  return reads.every((read) => read.readable && (read.raw === null || read.raw.length === 0));
}

function persistedHighScore(reads: HighScoreStorageRead[]): HighScoreRecord | null {
  for (const read of reads) {
    if (!read.readable || !read.raw) {
      continue;
    }

    try {
      const record = validatedHighScore(read.raw);
      if (record) {
        return record;
      }
    } catch {
      // Invalid residue is not a persisted high-score record.
    }
  }

  return null;
}

function readTokenLogRecord(raw: string | null): TokenLogReadResult {
  if (raw === null || raw.length === 0 || raw.length > TOKEN_LOG_MAX_RAW_CODE_UNITS) {
    return { status: "recoverable", sentences: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "recoverable", sentences: [] };
  }

  if (!isRecord(parsed)) {
    return { status: "recoverable", sentences: [] };
  }

  if (typeof parsed.version === "number" && parsed.version > TOKEN_LOG_VERSION) {
    return { status: "future", sentences: [] };
  }

  if (
    (parsed.version !== TOKEN_LOG_VERSION && parsed.version !== LEGACY_TOKEN_LOG_VERSION)
    || !Array.isArray(parsed.sentences)
  ) {
    return { status: "recoverable", sentences: [] };
  }

  return {
    status: "current",
    sentences: validTokenLogSentences(
      parsed.sentences,
      parsed.version === LEGACY_TOKEN_LOG_VERSION
    )
  };
}

function readTrainingProgress(raw: string | null): TrainingProgressRecord {
  if (!raw) {
    return emptyTrainingProgress();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed)
      || parsed.version !== TRAINING_PROGRESS_VERSION
      || !Array.isArray(parsed.fixtures)
    ) {
      return emptyTrainingProgress();
    }

    return validTrainingProgress({
      resolvedCount: parsed.resolvedCount as number,
      fixtures: parsed.fixtures as TrainingFixtureProgress[]
    });
  } catch {
    return emptyTrainingProgress();
  }
}

function validTrainingProgress(progress: TrainingProgressRecord): TrainingProgressRecord {
  const resolvedCount = validCount(progress.resolvedCount) ?? 0;
  const fixtures: TrainingFixtureProgress[] = [];
  const seenFixtureIds = new Set<string>();

  for (const value of Array.isArray(progress.fixtures) ? progress.fixtures : []) {
    if (!isRecord(value)) {
      continue;
    }
    const fixtureId = validFixtureId(value.fixtureId);
    const resolvedAt = validCount(value.resolvedAt);
    if (
      !fixtureId
      || seenFixtureIds.has(fixtureId)
      || typeof value.passed !== "boolean"
      || resolvedAt === null
      || resolvedAt < 1
      || resolvedAt > resolvedCount
    ) {
      continue;
    }
    seenFixtureIds.add(fixtureId);
    fixtures.push({ fixtureId, passed: value.passed, resolvedAt });
    if (fixtures.length >= TRAINING_PROGRESS_FIXTURE_LIMIT) {
      break;
    }
  }

  return { resolvedCount, fixtures };
}

function emptyTrainingProgress(): TrainingProgressRecord {
  return { resolvedCount: 0, fixtures: [] };
}

function readHapticPreferenceRecord(raw: string | null): HapticPreferenceLoadResult {
  if (raw === null) {
    return { status: "missing", enabled: null };
  }

  if (raw.length === 0 || raw.length > HAPTIC_PREFERENCE_MAX_RAW_CODE_UNITS) {
    return { status: "recoverable", enabled: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "recoverable", enabled: null };
  }

  if (!isRecord(parsed)) {
    return { status: "recoverable", enabled: null };
  }

  if (typeof parsed.version === "number" && parsed.version > HAPTIC_PREFERENCE_VERSION) {
    return { status: "future", enabled: null };
  }

  if (parsed.version !== HAPTIC_PREFERENCE_VERSION || typeof parsed.enabled !== "boolean") {
    return { status: "recoverable", enabled: null };
  }

  return { status: "stored", enabled: parsed.enabled };
}

function readMotionPreferenceRecord(raw: string | null): MotionPreferenceLoadResult {
  if (raw === null) {
    return { status: "missing", reduced: null };
  }

  if (raw.length === 0 || raw.length > MOTION_PREFERENCE_MAX_RAW_CODE_UNITS) {
    return { status: "recoverable", reduced: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "recoverable", reduced: null };
  }

  if (!isRecord(parsed)) {
    return { status: "recoverable", reduced: null };
  }

  if (typeof parsed.version === "number" && parsed.version > MOTION_PREFERENCE_VERSION) {
    return { status: "future", reduced: null };
  }

  if (parsed.version !== MOTION_PREFERENCE_VERSION || typeof parsed.reduced !== "boolean") {
    return { status: "recoverable", reduced: null };
  }

  return { status: "stored", reduced: parsed.reduced };
}

function validTokenLogSentences(
  values: unknown[],
  allowLegacyLastResultInference = false
): TokenLogSentenceRecord[] {
  const sentences: TokenLogSentenceRecord[] = [];
  const seenTexts = new Set<string>();

  for (const value of values) {
    const sentence = validTokenLogSentence(value, allowLegacyLastResultInference);
    const textKey = sentence?.text.normalize("NFC").toLocaleLowerCase("en-US");
    if (!sentence || !textKey || seenTexts.has(textKey)) {
      continue;
    }

    seenTexts.add(textKey);
    sentences.push(sentence);
    if (sentences.length >= TOKEN_LOG_SENTENCE_LIMIT) {
      break;
    }
  }

  return sentences;
}

function validTokenLogSentence(
  value: unknown,
  allowLegacyLastResultInference = false
): TokenLogSentenceRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = validFixtureId(value.id);
  const text = validTokenLogText(value.text);
  const attempts = validCount(value.attempts);
  const successfulAttempts = validCount(value.successfulAttempts);
  const lastSuccessful = typeof value.lastSuccessful === "boolean"
    ? value.lastSuccessful
    : allowLegacyLastResultInference && attempts !== null && successfulAttempts !== null
      ? successfulAttempts === attempts
      : null;
  const mapping = validTokenMapping(value.tokenStrings, value.tokenIds, text);
  if (
    !id
    || !text
    || attempts === null
    || attempts < 1
    || successfulAttempts === null
    || successfulAttempts > attempts
    || lastSuccessful === null
    || !Array.isArray(value.fixtureIds)
    || !mapping
  ) {
    return null;
  }

  const fixtureIds = uniqueStrings(value.fixtureIds, TOKEN_LOG_FIXTURE_LIMIT, (candidate) =>
    TOKEN_LOG_FIXTURE_ID_PATTERN.test(candidate)
  );
  if (fixtureIds.length === 0) {
    return null;
  }

  return {
    id,
    text,
    fixtureIds,
    attempts,
    successfulAttempts,
    lastSuccessful,
    tokenStrings: mapping.tokenStrings,
    tokenIds: mapping.tokenIds
  };
}

function mergeTokenLogObservations(
  existing: readonly TokenLogSentenceRecord[],
  observations: readonly TokenLogSentenceObservation[]
): TokenLogSentenceRecord[] {
  const sentences = existing.map(cloneTokenLogSentence);
  const byText = new Map(sentences.map((sentence) => [normalizedSentenceText(sentence.text), sentence]));

  for (const rawObservation of observations) {
    const observation = validTokenLogObservation(rawObservation);
    if (!observation) {
      continue;
    }

    const textKey = normalizedSentenceText(observation.text);
    const existingSentence = byText.get(textKey);
    if (existingSentence) {
      existingSentence.attempts += 1;
      if (observation.successful) {
        existingSentence.successfulAttempts += 1;
      }
      existingSentence.lastSuccessful = observation.successful;
      if (!existingSentence.fixtureIds.includes(observation.fixtureId) && existingSentence.fixtureIds.length < TOKEN_LOG_FIXTURE_LIMIT) {
        existingSentence.fixtureIds.push(observation.fixtureId);
      }
      continue;
    }

    if (sentences.length >= TOKEN_LOG_SENTENCE_LIMIT) {
      continue;
    }
    const sentence: TokenLogSentenceRecord = {
      id: observation.fixtureId,
      text: observation.text,
      fixtureIds: [observation.fixtureId],
      attempts: 1,
      successfulAttempts: observation.successful ? 1 : 0,
      lastSuccessful: observation.successful,
      tokenStrings: [...observation.tokenStrings],
      tokenIds: [...observation.tokenIds]
    };
    sentences.push(sentence);
    byText.set(textKey, sentence);
  }

  return sentences;
}

function validTokenLogObservation(value: unknown): TokenLogSentenceObservation | null {
  if (!isRecord(value)) {
    return null;
  }
  const fixtureId = validFixtureId(value.fixtureId);
  const text = validTokenLogText(value.text);
  const mapping = validTokenMapping(value.tokenStrings, value.tokenIds, text);
  if (!fixtureId || !text || typeof value.successful !== "boolean" || !mapping) {
    return null;
  }
  return {
    fixtureId,
    text,
    successful: value.successful,
    tokenStrings: mapping.tokenStrings,
    tokenIds: mapping.tokenIds
  };
}

function validTokenMapping(
  rawStrings: unknown,
  rawIds: unknown,
  expectedText: string | null
): { tokenStrings: string[]; tokenIds: number[] } | null {
  if (!expectedText || !Array.isArray(rawStrings) || !Array.isArray(rawIds)) {
    return null;
  }
  if (
    rawStrings.length === 0
    || rawStrings.length > TOKEN_LOG_TOKEN_LIMIT
    || rawStrings.length !== rawIds.length
  ) {
    return null;
  }
  const tokenStrings = rawStrings.map(validTokenLogText);
  const tokenIds = rawIds.map(validTokenId);
  if (tokenStrings.some((token) => token === null) || tokenIds.some((id) => id === null)) {
    return null;
  }
  const strings = tokenStrings as string[];
  if (strings.join("") !== expectedText) {
    return null;
  }
  return { tokenStrings: strings, tokenIds: tokenIds as number[] };
}

function validTokenLogText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= TOKEN_LOG_TEXT_MAX_CODE_UNITS
    ? value
    : null;
}

function validCount(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 1_000_000
    ? value as number
    : null;
}

function validTokenId(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
}

function uniqueStrings(
  values: unknown[],
  limit: number,
  accepts: (value: string) => boolean
): string[] {
  const strings: string[] = [];
  for (const value of values) {
    if (typeof value !== "string" || !accepts(value) || strings.includes(value)) {
      continue;
    }
    strings.push(value);
    if (strings.length >= limit) {
      break;
    }
  }
  return strings;
}

function validFixtureId(value: unknown): string | null {
  return typeof value === "string" && TOKEN_LOG_FIXTURE_ID_PATTERN.test(value) ? value : null;
}

function normalizedSentenceText(text: string): string {
  return text.normalize("NFC").toLocaleLowerCase("en-US");
}

function cloneTokenLogSentence(sentence: TokenLogSentenceRecord): TokenLogSentenceRecord {
  return {
    ...sentence,
    fixtureIds: [...sentence.fixtureIds],
    tokenStrings: [...sentence.tokenStrings],
    tokenIds: [...sentence.tokenIds]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
