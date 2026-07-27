import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import { describe, expect, it } from "vitest";

const cl100kEncoding = getEncoding("cl100k_base");
const p50kEncoding = getEncoding("p50k_base");

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("numerical token comprehension probe", () => {
  it("keeps the probe separate, unscored, and explanation-led", () => {
    const protocol = readRepoFile("docs/token_comprehension_probe.md");

    expect(protocol).toContain("not a game mode, score, progression gate");
    expect(protocol).toContain("These sessions do not count toward the main protocol's unprompted handoff");
    expect(protocol).toContain("The only neutral follow-up is `Tell me why.`");
    expect(protocol).toContain("Confidence is diagnostic only");
    expect(protocol).toContain("at least 4 of 5 novices pass each individual claim");
    expect(protocol).toContain("at least 4 of 5 novices pass all three items without coaching");
  });

  it("uses real cl100k_base near-transfer chunks in both forms", () => {
    expect(cl100kEncoding.encode("don't split that yet")).toEqual([15357, 956, 6859, 430, 3686]);
    expect(cl100kEncoding.encode("don't split that yet").map((id) => cl100kEncoding.decode([id])))
      .toEqual(["don", "'t", " split", " that", " yet"]);
    expect(cl100kEncoding.encode("we're testing tokens now")).toEqual([906, 2351, 7649, 11460, 1457]);
    expect(cl100kEncoding.encode("we're testing tokens now").map((id) => cl100kEncoding.decode([id])))
      .toEqual(["we", "'re", " testing", " tokens", " now"]);
  });

  it("uses real cross-encoding IDs and rejects magnitude as score", () => {
    const protocol = readRepoFile("docs/token_comprehension_probe.md");

    expect(cl100kEncoding.encode("cat")).toEqual([4719]);
    expect(p50kEncoding.encode("cat")).toEqual([9246]);
    expect(cl100kEncoding.encode("dog")).toEqual([18964]);
    expect(p50kEncoding.encode("dog")).toEqual([9703]);
    expect(protocol).toContain("the larger number is not a higher score");
    expect(protocol).toMatch(/vocabulary identifiers or\s+lookup keys/);
  });

  it("links the separate probe from the canonical playtest protocol", () => {
    const protocol = readRepoFile("docs/user_playtest_protocol.md");

    expect(protocol).toContain("## Separate Numerical Token Probe");
    expect(protocol).toContain("docs/token_comprehension_probe.md");
    expect(protocol).toContain("Do not count those dedicated probe sessions");
  });
});
