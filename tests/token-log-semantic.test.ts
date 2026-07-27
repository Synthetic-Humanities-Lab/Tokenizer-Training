import { describe, expect, it } from "vitest";
import { describeTokenWhitespace } from "../src/game/systems/TokenDisplaySystem";
import { summarizeTokenLog, tokenLogEntries } from "../src/game/systems/TokenLogSystem";
import { tokenLogSemanticSnapshot } from "../src/game/systems/TokenLogSemanticSystem";
import type { TokenLogSentenceRecord } from "../src/game/systems/StorageSystem";

function sentenceRecord(overrides: Partial<TokenLogSentenceRecord> = {}): TokenLogSentenceRecord {
  return {
    id: "simple_001",
    text: "the cat",
    fixtureIds: ["simple_001"],
    attempts: 1,
    successfulAttempts: 1,
    lastSuccessful: true,
    tokenStrings: ["the", " cat"],
    tokenIds: [1820, 8415],
    ...overrides
  };
}

describe("Token Log semantic projection", () => {
  it("describes whitespace inside exact token pieces", () => {
    expect(describeTokenWhitespace(" cat")).toBe(
      "Whitespace: U+0020 SPACE at code point position 1 (including the leading position)."
    );
  });

  it("publishes complete sentence mappings, status, counts, and page actions", () => {
    const entries = tokenLogEntries([
      sentenceRecord(),
      sentenceRecord({
        id: "punct_002",
        text: "re-enter the room",
        fixtureIds: ["punct_002"],
        attempts: 2,
        successfulAttempts: 1,
        lastSuccessful: false,
        tokenStrings: ["re", "-enter", " the", " room"],
        tokenIds: [265, 49315, 279, 3130]
      })
    ]);
    const summary = summarizeTokenLog(entries, 0);
    const snapshot = tokenLogSemanticSnapshot(entries, summary, false, true);

    expect(snapshot.scene).toBe("token-log");
    expect(snapshot.heading).toBe("Token Log");
    expect(snapshot.summary).toContain("2 of 200 unique samples recorded; 1 correct and 1 marked for review");
    expect(snapshot.groups?.map(({ heading }) => heading)).toEqual([
      "the cat: Correct",
      "re-enter the room: Review"
    ]);
    expect(snapshot.groups?.[0].mappings).toEqual([
      {
        id: "simple_001:token-1",
        positionLabel: "Token piece 1",
        rawText: "the",
        displayText: "the",
        valueLabel: "cl100k_base ID",
        value: 1820
      },
      {
        id: "simple_001:token-2",
        positionLabel: "Token piece 2",
        rawText: " cat",
        displayText: "␠cat",
        description: "Whitespace: U+0020 SPACE at code point position 1 (including the leading position).",
        valueLabel: "cl100k_base ID",
        value: 8415
      }
    ]);
    expect(snapshot.actions).toEqual([
      { id: "previous", label: "Previous page", disabled: true },
      { id: "back", label: "Back" },
      { id: "next", label: "Next page", disabled: false }
    ]);
  });

  it("announces catalog completion without treating token IDs as points", () => {
    const snapshot = tokenLogSemanticSnapshot([], {
      totalCount: 200,
      correctCount: 184,
      reviewCount: 16,
      quota: 200,
      remainingCount: 0,
      label: "SAMPLES 200/200 / COMPLETE / REVIEW 16 / PAGE 1/67"
    }, false, false);

    expect(snapshot.summary).toContain("Catalog complete: 200 of 200 unique samples recorded");
    expect(snapshot.summary).toContain("vocabulary lookup numbers, not scores");
  });
});
