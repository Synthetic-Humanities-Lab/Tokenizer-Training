import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import { StorageSystem, type StorageLike } from "../src/game/systems/StorageSystem";
import {
  computeTokenLogLayout,
  computeTokenLogTokenCells,
  summarizeTokenLog,
  TOKEN_LOG_QUOTA,
  tokenLogEntries,
  tokenLogPage,
  tokenLogPageCount,
  tokenLogQuotaProgress,
  tokenLogSentenceObservation
} from "../src/game/systems/TokenLogSystem";
import { TokenizerSystem, type TokenFixture } from "../src/game/systems/TokenizerSystem";
import { TutorialSystem } from "../src/game/systems/TutorialSystem";

const fixtures = fixturesJson as TokenFixture[];

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function fixture(id: string): TokenFixture {
  const found = fixtures.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

function cleanObservation(id: string) {
  return tokenLogSentenceObservation(fixture(id), { missedCuts: [], falseCuts: [] });
}

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("Token Log", () => {
  it("records one complete sentence with its exact ordered token mapping", () => {
    const observation = cleanObservation("simple_001");
    const storage = new StorageSystem(new MemoryStorage());
    storage.rememberTokenLogSentences([observation]);
    const [entry] = tokenLogEntries(storage.loadTokenLogSentences());

    expect(entry).toMatchObject({
      id: "simple_001",
      text: "the cat sat on the mat",
      attempts: 1,
      successfulAttempts: 1,
      successful: true
    });
    expect(entry.tokenMappings.map(({ rawText, displayText, tokenId }) => ({ rawText, displayText, tokenId })))
      .toEqual([
        { rawText: "the", displayText: "the", tokenId: 1820 },
        { rawText: " cat", displayText: "␠cat", tokenId: 8415 },
        { rawText: " sat", displayText: "␠sat", tokenId: 7731 },
        { rawText: " on", displayText: "␠on", tokenId: 389 },
        { rawText: " the", displayText: "␠the", tokenId: 279 },
        { rawText: " mat", displayText: "␠mat", tokenId: 5634 }
      ]);
  });

  it("uses the latest attempt for Review and lets a clean retry recover", () => {
    const storage = new StorageSystem(new MemoryStorage());
    storage.rememberTokenLogSentences([cleanObservation("simple_001")]);
    storage.rememberTokenLogSentences([
      tokenLogSentenceObservation(fixture("simple_001"), { missedCuts: [3], falseCuts: [] })
    ]);

    const entries = tokenLogEntries(storage.loadTokenLogSentences());
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ attempts: 2, successfulAttempts: 1, successful: false });

    storage.rememberTokenLogSentences([cleanObservation("simple_001")]);

    const [recovered] = tokenLogEntries(storage.loadTokenLogSentences());
    expect(recovered).toMatchObject({
      attempts: 3,
      successfulAttempts: 2,
      successful: true
    });
  });

  it("contains all ten tutorial sentences after tutorial completion", () => {
    const tokenizer = new TokenizerSystem();
    const tutorial = new TutorialSystem();
    const storage = new StorageSystem(new MemoryStorage());

    for (let index = 0; index < tutorial.count(); index += 1) {
      const sample = tokenizer.byId(tutorial.byIndex(index)!.fixtureId)!;
      storage.rememberTokenLogSentences([
        tokenLogSentenceObservation(sample, { missedCuts: [], falseCuts: [] })
      ]);
    }

    const entries = tokenLogEntries(storage.loadTokenLogSentences());
    expect(entries).toHaveLength(10);
    expect(entries.map(({ text }) => text)).toEqual([
      "the cat sat on the mat",
      "how many dogs are there",
      "draw the boundary line",
      "spaces matter",
      "re-enter the room",
      "I can't believe it.",
      "wait... what?",
      "wiener.ai/pricing",
      "it costs $19.99",
      "pay cost and balance"
    ]);
    expect(entries.every(({ successful }) => successful)).toBe(true);
  });

  it("paginates complete sentence rows without dropping entries", () => {
    const storage = new StorageSystem(new MemoryStorage());
    for (const id of ["simple_001", "simple_002", "simple_010", "chaos_005"]) {
      storage.rememberTokenLogSentences([cleanObservation(id)]);
    }
    const entries = tokenLogEntries(storage.loadTokenLogSentences());
    const pages = Array.from({ length: tokenLogPageCount(entries.length) }, (_, page) => tokenLogPage(entries, page));

    expect(pages.map((page) => page.length)).toEqual([3, 1]);
    expect(pages.flat().map(({ id }) => id)).toEqual(entries.map(({ id }) => id));
    expect(summarizeTokenLog(entries, 1)).toMatchObject({
      quota: TOKEN_LOG_QUOTA,
      remainingCount: 196,
      label: "SAMPLES 4/200 / REVIEW 0 / PAGE 2/2"
    });
    expect(summarizeTokenLog(entries.slice(0, 1), 0).label).toBe("SAMPLES 1/200 / REVIEW 0 / PAGE 1/1");
    expect(summarizeTokenLog([], 0).label).toBe("SAMPLES 0/200 / NO RECORDS");
  });

  it("marks the finite corpus quota complete after all 200 unique sentences", () => {
    const entries = tokenLogEntries(fixtures.map((sample) => ({
      id: sample.id,
      text: sample.text,
      fixtureIds: [sample.id],
      attempts: 1,
      successfulAttempts: 1,
      lastSuccessful: true,
      tokenStrings: sample.token_strings,
      tokenIds: sample.token_ids
    })));

    expect(summarizeTokenLog(entries, 0)).toMatchObject({
      totalCount: 200,
      quota: 200,
      remainingCount: 0,
      label: "SAMPLES 200/200 / COMPLETE / REVIEW 0 / PAGE 1/67"
    });
  });

  it("turns the finite sentence quota into a bounded filing progress value", () => {
    expect(tokenLogQuotaProgress(0)).toBe(0);
    expect(tokenLogQuotaProgress(1)).toBe(0.005);
    expect(tokenLogQuotaProgress(100)).toBe(0.5);
    expect(tokenLogQuotaProgress(200)).toBe(1);
    expect(tokenLogQuotaProgress(240)).toBe(1);
    expect(tokenLogQuotaProgress(-4)).toBe(0);
  });

  it("keeps the fixed quota synchronized with the generated corpus", () => {
    expect(TOKEN_LOG_QUOTA).toBe(200);
    expect(fixtures).toHaveLength(TOKEN_LOG_QUOTA);
  });

  it("keeps three non-overlapping sentence rows and navigation inside required viewports", () => {
    for (const [width, height, mobile] of [
      [320, 568, true],
      [390, 844, true],
      [430, 932, true],
      [1280, 720, false]
    ] as const) {
      const layout = computeTokenLogLayout(width, height, mobile);
      const cardTop = layout.card.y - layout.card.height / 2;
      const cardBottom = layout.card.y + layout.card.height / 2;

      expect(layout.rows).toHaveLength(3);
      expect(layout.quotaProgress.y + layout.quotaProgress.height / 2)
        .toBeLessThan(layout.rows[0].y - layout.rows[0].height / 2);
      for (let index = 0; index < layout.rows.length; index += 1) {
        const row = layout.rows[index];
        expect(row.y - row.height / 2).toBeGreaterThan(cardTop);
        if (index > 0) {
          expect(row.y - row.height / 2).toBeGreaterThan(
            layout.rows[index - 1].y + layout.rows[index - 1].height / 2
          );
        }
      }
      expect(layout.rows.at(-1)!.y + layout.rows.at(-1)!.height / 2)
        .toBeLessThan(layout.backButton.y - layout.backButton.height / 2);
      expect(layout.backButton.y + layout.backButton.height / 2).toBeLessThan(cardBottom);
    }
  });

  it("lays complete sentence tokens out as bounded evidence cells", () => {
    const maximumCorpusTokenCount = Math.max(...fixtures.map(({ token_count }) => token_count));

    for (const [width, height] of [[320, 568], [390, 844], [430, 932]] as const) {
      const row = computeTokenLogLayout(width, height, true).rows[0];
      const rowLeft = row.x - row.width / 2;
      const rowRight = row.x + row.width / 2;
      const rowTop = row.y - row.height / 2;
      const rowBottom = row.y + row.height / 2;

      for (let tokenCount = 1; tokenCount <= maximumCorpusTokenCount; tokenCount += 1) {
        const cells = computeTokenLogTokenCells(row, tokenCount);
        expect(cells).toHaveLength(tokenCount);
        cells.forEach((cell) => {
          expect(cell.x - cell.width / 2).toBeGreaterThanOrEqual(rowLeft);
          expect(cell.x + cell.width / 2).toBeLessThanOrEqual(rowRight);
          expect(cell.y - cell.height / 2).toBeGreaterThan(rowTop);
          expect(cell.y + cell.height / 2).toBeLessThanOrEqual(rowBottom);
        });
      }
    }
  });

  it("keeps corpus lookup out of storage and records only after feedback summarization", () => {
    const storageSource = readRepoFile("src/game/systems/StorageSystem.ts");
    const playSource = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = playSource.match(
      /private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/
    )?.[0] ?? "";
    const summarizeCall = "const summary = this.feedback.summarize(this.currentFixture, score);";
    const rememberCall = "this.storage.rememberTokenLogSentences([tokenLogSentenceObservation(this.currentFixture, score)]);";
    const refreshCall = "this.refreshTokenLogQuotaCount();";

    expect(storageSource).not.toContain("data/fixtures.json");
    expect(resolveMethod).toContain(summarizeCall);
    expect(resolveMethod).toContain(rememberCall);
    expect(resolveMethod.indexOf(rememberCall)).toBeGreaterThan(resolveMethod.indexOf(summarizeCall));
    expect(resolveMethod.indexOf(refreshCall)).toBeGreaterThan(resolveMethod.indexOf(rememberCall));
    expect(playSource).toContain('label: "SAMPLES"');
    expect(playSource).toContain("target: TOKEN_LOG_QUOTA");
  });

  it("counts tutorial resolutions toward the same persistent Training quota", () => {
    const playSource = readRepoFile("src/game/scenes/PlayScene.ts");
    const createSetup = playSource.slice(
      playSource.indexOf("  create(data: PlaySceneData): void {"),
      playSource.indexOf("    this.currentTutorialRound = undefined;")
    );
    const resolveMethod = playSource.match(
      /private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/
    )?.[0] ?? "";

    expect(createSetup).toContain("this.trainingFixtureSchedule.restore(this.storage.loadTrainingProgress());");
    expect(createSetup).not.toContain("this.trainingFixtureSchedule.reset();");
    expect(resolveMethod).toContain("this.trainingFixtureSchedule.recordResult(");
    expect(resolveMethod).toContain("this.storage.saveTrainingProgress(this.trainingFixtureSchedule.snapshot());");
    expect(resolveMethod).not.toMatch(/if \(!this\.tutorialMode\) \{\s*this\.trainingFixtureSchedule\.recordResult/);
  });
});
