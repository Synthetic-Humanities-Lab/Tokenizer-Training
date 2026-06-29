import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  evaluatePlaytestRollup,
  parsePlaytestRollup,
  renderPlaytestRollupEvaluation
} from "../scripts/evaluate-playtest-rollup";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

const completedRollup = `# Tokenizer Training Playtest Rollup

## Session Index

| Tester | Run ID | Input | Start Source | Result Summary Captured | Notes File |
| --- | --- | --- | --- | --- | --- |
| 1 | mtt-20260606-100001z | touch | handoff screen | yes | docs/playtests/session-1.md |
| 2 | mtt-20260606-100002z | mouse | handoff screen | yes | docs/playtests/session-2.md |
| 3 | mtt-20260606-100003z | touch | handoff screen | yes | docs/playtests/session-3.md |
| 4 | mtt-20260606-100004z | mouse | handoff screen | yes | docs/playtests/session-4.md |
| 5 | mtt-20260606-100005z | touch | handoff screen | yes | docs/playtests/session-5.md |

## Pass-Criteria Tally

| Criterion | Threshold | Passed Sessions | Evidence / Contradictions | Decision |
| --- | --- | --- | --- | --- |
| First tutorial action without outside instruction | at least 4 of 5 | 5/5 | All five testers swiped in tutorial without coaching; P2 hesitated but acted before the 30-second prompt. | pass |
| Explains one non-word tokenization behavior after tutorial | at least 4 of 5 | 4/5 | Four testers named spaces traveling, punctuation splitting, or URL fragmentation after review. | pass |
| Starts Endless from tutorial-complete handoff without outside instruction | at least 4 of 5 | 5/5 | Every tester clicked Start Endless Training from the handoff without facilitator instruction. | pass |
| Explains pay minus cost equals net after a review state | at least 4 of 5 | 4/5 | Four testers explained pay minus company cost made the net line in review. | pass |
| No systematic swipe/snap mistrust | 5 of 5, no systematic complaint | 5/5 | No tester blamed snap or gesture precision; one false cut was described as a prediction error. | pass |
| Mobile readability holds on real device | all mobile sessions | 3/3 | Phone screenshots and observer notes captured HUD, static prompt text, review markers, feedback, and Wiener speech readable without clipping or finger occlusion. | pass |
| Degraded AI labor frame noticed without being told | at least 3 of 5 | 4/5 | Four testers described payroll audit, browser work, supervisor pressure, or cost recovery without being told. | pass |
| Engagement and degraded visual intent observed | at least 3 of 5 | 4/5 | Four testers wanted another round or kept playing, and said the degraded assistant-browser visual style felt intentional rather than broken. | pass |
| Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record | at least 4 of 5 | 5/5 | All five pasted Copy Summary text with run ID, handoff screen start, input, fixture round trace, OK/Missed/False counts, net, and best saved. | pass |

## Aggregate Signals

- Median rounds completed: 7
- Lowest accuracy: 58%
- Highest false-cut count: 3
- Repeated missed-boundary pattern: dense URL dots and slashes caused most misses
- Repeated false-cut pattern: early speculative cuts around spaces decreased after tutorial review
- Reported input mistrust: none reported across five sessions
- Mobile readability issue: none; screenshots and observer notes covered HUD, review, feedback, and Wiener speech
- Strongest evidence that tokenization was learned: P3 explained that spaces can belong to the following token and then avoided double-cutting the next space round.
- Strongest evidence that the labor/cost frame landed: P4 called the game a payroll audit for human token cleanup without facilitator prompting.
- Strongest evidence that play stayed engaging and the visual style landed: P2 wanted another round and said the degraded assistant-browser visual style felt intentional, not broken.

## Principle Embodiment Audit

| Principle Area | Required Evidence | Strongest Evidence / Contradiction | Decision |
| --- | --- | --- | --- |
| Top game design | Player understands the prompt, action, evidence, consequence, and continuation loop without external explanation. | All five testers moved from tutorial action to review evidence to handoff and endless continuation without coaching. | embodied |
| Critical/conceptual play | Player notices the degraded AI labor, cost, audit, rank, or browser frame through play. | Four testers described supervisor, payroll, audit, rank, or browser labor without the facilitator naming the frame. | embodied |
| Emotional design | Player treats errors as earned and recoverable rather than arbitrary or hostile. | Testers used Clear Cuts, accepted missed/false review labels, and described errors as prediction mistakes rather than unfairness. | embodied |
| Game feel | Player trusts swipe/snap behavior and can recover from cuts without input blame. | No tester reported systematic snap mistrust; touch testers used Clear Cuts or adjusted swipes without blaming input precision. | embodied |
| Optimal visual display | Player can read HUD, text, markers, feedback, Wiener speech, and result evidence on the tested device. | Phone screenshots and observer notes show HUD, text, review markers, feedback card, Wiener speech, and results readable without overlap. | embodied |

Principle verdict:

- Major principles embodied: All five principle areas are supported by tester behavior, quotes, screenshots, and copied summaries.
- Major principles not yet embodied: none

## Decision

Choose one:

- Broader playtest ready: yes
- Iterate before broader playtest: no

Required change list before the next build:

- none
`;

describe("playtest rollup evaluator", () => {
  it("accepts a completed rollup only when thresholds and principle audit are supported", () => {
    const evaluation = evaluatePlaytestRollup(completedRollup, "completed-rollup.md");
    const rollup = parsePlaytestRollup(completedRollup, "completed-rollup.md");

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(rollup.sessionIndexRows).toHaveLength(5);
    expect(rollup.criterionRows).toHaveLength(9);
    expect(rollup.principleRows).toHaveLength(5);
    expect(rollup.principleVerdict.notYetEmbodied).toBe("none");
  });

  it("rejects the blank rollup template as unproven evidence", () => {
    const evaluation = evaluatePlaytestRollup(readRepoFile("docs/playtest_rollup_template.md"));

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("session 1: missing or invalid run ID.");
    expect(evaluation.issues).toContain("First tutorial action without outside instruction: passed sessions must use a count such as 4/5 or 4 of 5.");
    expect(evaluation.issues).toContain("Top game design: principle evidence is missing or generic.");
    expect(evaluation.issues).toContain("Final decision must mark Broader playtest ready as yes/pass/ready.");
  });

  it("rejects positive principle rows that do not cite area-specific behavior", () => {
    const thinPrinciples = completedRollup
      .replace(
        "All five testers moved from tutorial action to review evidence to handoff and endless continuation without coaching.",
        "All five testers liked the game and said it was strong."
      )
      .replace(
        "Four testers described supervisor, payroll, audit, rank, or browser labor without the facilitator naming the frame.",
        "Four testers liked the game and said it was strong."
      )
      .replace(
        "Testers used Clear Cuts, accepted missed/false review labels, and described errors as prediction mistakes rather than unfairness.",
        "Testers liked the game and said it was strong."
      )
      .replace(
        "No tester reported systematic snap mistrust; touch testers used Clear Cuts or adjusted swipes without blaming input precision.",
        "No tester disliked the game and everyone said it was strong."
      )
      .replace(
        "Phone screenshots and observer notes show HUD, text, review markers, feedback card, Wiener speech, and results readable without overlap.",
        "Phone testers liked the game and said it was strong."
      );

    const evaluation = evaluatePlaytestRollup(thinPrinciples, "thin-rollup.md");

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Top game design: principle evidence must name concrete behavior for that principle area."
    );
    expect(evaluation.issues).toContain(
      "Critical/conceptual play: principle evidence must name concrete behavior for that principle area."
    );
    expect(evaluation.issues).toContain(
      "Emotional design: principle evidence must name concrete behavior for that principle area."
    );
    expect(evaluation.issues).toContain(
      "Game feel: principle evidence must name concrete behavior for that principle area."
    );
    expect(evaluation.issues).toContain(
      "Optimal visual display: principle evidence must name concrete behavior for that principle area."
    );
  });

  it("rejects generic aggregate signals that do not summarize concrete session patterns", () => {
    const thinAggregates = completedRollup
      .replace("- Median rounds completed: 7", "- Median rounds completed: many")
      .replace("- Lowest accuracy: 58%", "- Lowest accuracy: low")
      .replace("- Highest false-cut count: 3", "- Highest false-cut count: a few")
      .replace(
        "- Repeated missed-boundary pattern: dense URL dots and slashes caused most misses",
        "- Repeated missed-boundary pattern: some confusion"
      )
      .replace(
        "- Repeated false-cut pattern: early speculative cuts around spaces decreased after tutorial review",
        "- Repeated false-cut pattern: some confusion"
      )
      .replace("- Reported input mistrust: none reported across five sessions", "- Reported input mistrust: all good")
      .replace(
        "- Mobile readability issue: none; screenshots and observer notes covered HUD, review, feedback, and Wiener speech",
        "- Mobile readability issue: all good"
      )
      .replace(
        "- Strongest evidence that tokenization was learned: P3 explained that spaces can belong to the following token and then avoided double-cutting the next space round.",
        "- Strongest evidence that tokenization was learned: players understood it"
      )
      .replace(
        "- Strongest evidence that the labor/cost frame landed: P4 called the game a payroll audit for human token cleanup without facilitator prompting.",
        "- Strongest evidence that the labor/cost frame landed: players understood it"
      )
      .replace(
        "- Strongest evidence that play stayed engaging and the visual style landed: P2 wanted another round and said the degraded assistant-browser visual style felt intentional, not broken.",
        "- Strongest evidence that play stayed engaging and the visual style landed: players liked it"
      );

    const evaluation = evaluatePlaytestRollup(thinAggregates, "thin-aggregates.md");

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Median rounds completed: aggregate signal must include a numeric median round count.");
    expect(evaluation.issues).toContain("Lowest accuracy: aggregate signal must include a numeric accuracy value.");
    expect(evaluation.issues).toContain("Highest false-cut count: aggregate signal must include a numeric false-cut count.");
    expect(evaluation.issues).toContain(
      "Repeated missed-boundary pattern: aggregate signal must include a concrete missed-boundary pattern or explicit no-repeated-pattern note."
    );
    expect(evaluation.issues).toContain(
      "Repeated false-cut pattern: aggregate signal must include a concrete false-cut pattern or explicit no-repeated-pattern note."
    );
    expect(evaluation.issues).toContain(
      "Reported input mistrust: aggregate signal must include a concrete input-trust observation or explicit no-mistrust note."
    );
    expect(evaluation.issues).toContain(
      "Mobile readability issue: aggregate signal must include a concrete mobile readability issue or explicit no-issue note."
    );
    expect(evaluation.issues).toContain(
      "Strongest evidence that tokenization was learned: aggregate signal must include a concrete tokenization-learning observation."
    );
    expect(evaluation.issues).toContain(
      "Strongest evidence that the labor/cost frame landed: aggregate signal must include a concrete labor, browser, audit, rank, or cost-frame observation."
    );
    expect(evaluation.issues).toContain(
      "Strongest evidence that play stayed engaging and the visual style landed: aggregate signal must include a concrete engagement observation plus a visual-style or intentional-aesthetic observation."
    );
  });

  it("renders issue output for command-line use", () => {
    const output = renderPlaytestRollupEvaluation(evaluatePlaytestRollup(readRepoFile("docs/playtest_rollup_template.md")));

    expect(output).toContain("Tokenizer Training playtest rollup");
    expect(output).toContain("Decision: iterate before broader playtest");
    expect(output).toContain("Issues:");
    expect(output).toContain("Principle decisions:");
  });
});
