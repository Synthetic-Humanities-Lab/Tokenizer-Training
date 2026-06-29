# Tokenizer Training Playtest Rollup

Use this after five completed tester sessions. Do not use it to smooth over
contradictory evidence: failed, missing, or ambiguous notes should stay visible.

After filling the five session note files, run:

```sh
npm run playtest:evaluate -- docs/playtests/session-1.md docs/playtests/session-2.md docs/playtests/session-3.md docs/playtests/session-4.md docs/playtests/session-5.md
```

To create the completed-rollup file from this template without overwriting an
existing rollup, run:

```sh
npm run playtest:rollup
```

After completing that rollup, run:

```sh
npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md
```

The evaluator checks session metadata, placeholder metadata values, note tables,
per-criterion evidence text, criterion-specific pass evidence, debrief answers,
copied-summary fields, threshold counts, and real phone/tablet touch coverage.
For mobile readability passes, it also requires concrete visual evidence:
screenshot, photo, screen recording, or observer-note evidence naming the HUD,
static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger
occlusion.
A passing evaluator result is supporting evidence, not a substitute for reading
the observations and contradictions. Desktop touchscreens, trackpads, and
browser emulation do not count for the mobile readability gate.
The rollup evaluator rejects blank session-index rows, missing threshold counts,
generic evidence, aggregate signals without numeric counts or concrete observed
patterns, principle rows that do not name area-specific behavior, unsupported
principle decisions, unresolved major principle gaps, and a final decision that
does not explicitly mark broader playtest ready.
The engagement/aesthetic criterion requires both continued-play evidence and a
tester behavior or quote showing that the degraded visual style read as
intentional rather than broken.

## Session Index

| Tester | Run ID | Input | Start Source | Result Summary Captured | Notes File |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |
| 5 |  |  |  |  |  |

## Pass-Criteria Tally

| Criterion | Threshold | Passed Sessions | Evidence / Contradictions | Decision |
| --- | --- | --- | --- | --- |
| First tutorial action without outside instruction | at least 4 of 5 |  |  |  |
| Explains one non-word tokenization behavior after tutorial | at least 4 of 5 |  |  |  |
| Starts Endless from tutorial-complete handoff without outside instruction | at least 4 of 5 |  |  |  |
| Explains pay minus cost equals net after a review state | at least 4 of 5 |  |  |  |
| No systematic swipe/snap mistrust | 5 of 5, no systematic complaint |  |  |  |
| Mobile readability holds on real device | all mobile sessions |  |  |  |
| Degraded AI labor frame noticed without being told | at least 3 of 5 |  |  |  |
| Engagement and degraded visual intent observed | at least 3 of 5 |  |  |  |
| Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record | at least 4 of 5 |  |  |  |

## Aggregate Signals

Use actual values from the five session notes. The first three fields require
numbers. Pattern fields must name the repeated boundary/input/mobile issue or
explicitly say no repeated issue was observed. The two strongest-evidence fields
must cite concrete tester behavior or quotes, not a generic verdict.

- Median rounds completed:
- Lowest accuracy:
- Highest false-cut count:
- Repeated missed-boundary pattern:
- Repeated false-cut pattern:
- Reported input mistrust:
- Mobile readability issue:
- Strongest evidence that tokenization was learned:
- Strongest evidence that the labor/cost frame landed:
- Strongest evidence that play stayed engaging and the visual style landed:

## Principle Embodiment Audit

Use this section to decide whether the playtest evidence actually supports the
design-principle claims in `docs/game_design_principles.md`. Do not infer a
principle from a passing threshold alone; cite the session evidence that proves
or contradicts it. The evidence must name the relevant behavior: loop flow for
top game design, labor/cost/browser recognition for critical play, earned and
recoverable errors for emotional design, snap/input trust for game feel, and
readable HUD/text/marker/feedback evidence for visual display.

| Principle Area | Required Evidence | Strongest Evidence / Contradiction | Decision |
| --- | --- | --- | --- |
| Top game design | Player understands the prompt, action, evidence, consequence, and continuation loop without external explanation. |  |  |
| Critical/conceptual play | Player notices the degraded AI labor, cost, audit, rank, or browser frame through play. |  |  |
| Emotional design | Player treats errors as earned and recoverable rather than arbitrary or hostile. |  |  |
| Game feel | Player trusts swipe/snap behavior and can recover from cuts without input blame. |  |  |
| Optimal visual display | Player can read HUD, text, markers, feedback, Wiener speech, and result evidence on the tested device. |  |  |

Principle verdict:

- Major principles embodied:
- Major principles not yet embodied:

## Decision

Choose one:

- Broader playtest ready:
- Iterate before broader playtest:

Required change list before the next build:

- 

Do not mark the design gate as passed unless every threshold row above has
clear evidence, the principle embodiment audit supports the five principle
areas, and no unresolved contradiction remains.
