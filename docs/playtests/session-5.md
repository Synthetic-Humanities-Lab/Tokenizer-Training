# Tokenizer Training Playtest Notes

Use this template for the first five-user playtest. Do not explain tokenization
or the fiction before the player has tried the tutorial. Keep
`docs/playtest_facilitator_card.md` beside the session. It is the table-side no-coaching script.

## Session Metadata

Fill every field. The evaluator rejects blank fields and template-placeholder
values such as `mouse / touch / pen / trackpad / mixed`, `same-machine / LAN`,
`yes / no`, or `screenshot / photo / screen recording / observer notes / none`.
The `Run ID` must be copied from the game or copied result summary and keep the
game-generated `tt-...` format.

- Tester ID: P5
- Date:
- Run ID:
- Device/browser:
- Input: mouse / touch / pen / trackpad / mixed
- Network: same-machine / LAN
- Launch URL:
- Facilitator:
- Reset used: yes / no
- Visual evidence: screenshot / photo / screen recording / observer notes / none

Mobile gate note: the evaluator counts mobile readability evidence only when
`Device/browser` names a real phone/tablet/mobile browser and `Input` is
`touch`, `pen`, or `mixed`, with `Network: LAN` and a `Launch URL` that uses
Vite's Network host rather than `localhost` or `127.0.0.1`. Mobile sessions
must record screenshot, photo, screen-recording, or observer-note evidence. A
pass for mobile readability must name a concrete artifact or observation plus
the readable surface: HUD, static prompt text, review markers, feedback,
Wiener speech, clipping, overlap, or finger occlusion.

## Copied Result Summary

Paste the result-screen Copy Summary output here. If clipboard copy fails and
the button changes to Save Summary, paste the downloaded text file instead.
The pasted `Run ID` should match the Session Metadata run ID, and the expected
post-tutorial Training run should include `Start: handoff screen` plus a
captured `Round trace` with fixture IDs, categories, tiers, token counts, and
OK/missed/false counts.
The copied `Input evidence:` line records the browser pointer type seen during
play; it supports the note but does not replace `Device/browser`, `Network:
LAN`, non-localhost `Launch URL`, or concrete visual evidence for the mobile
gate.

```text

```

## Observation Notes

Fill every row. The evaluator rejects blank pass cells, blank evidence cells,
bare verdict evidence such as `pass` or `yes`, and mobile readability notes that
do not name mobile or non-mobile context plus a readable surface or failure
mode. Observation rows and pass-criteria rows must not contradict each other.
If a matching observation row is `fail` or `ambiguous`, the matching pass
criterion cannot be `pass`; if the matching observation row is `pass`, the
matching pass criterion cannot be `fail`.
When recording evidence, explicitly note any duplicate slicing around visible
blank runs, whether returning to the centered blank slot cleaned accidental
ordinary-word duplicates without suppressing deliberate currency or punctuation
token cuts, whether the static prompt stayed centered in the active lane and
clear of HUD, Wiener speech, review evidence, feedback, and controls, whether
near-text Wiener speech was noticed without looking for a second panel, and whether
Wiener tutorial speech taught both the labor/browser frame and tokenizer
mechanics without facilitator explanation.

| Observation | Evidence | Pass? |
| --- | --- | --- |
| First tutorial action without outside instruction |  |  |
| Pale guides understood as legal slots, not answers |  |  |
| Spaces not systematically over-cut |  |  |
| Clear Cuts discovered or understood |  |  |
| Snap positions trusted |  |  |
| Missed/false review markers understood |  |  |
| Pay, cost, net, balance, and rank understood |  |  |
| Tutorial-complete handoff: Start Training selected without prompting |  |  |
| Dense strings read as higher-risk tokenization |  |  |
| Degraded AI labor frame noticed through play |  |  |
| Degraded visual style felt intentional and play invited another round |  |  |
| Errors felt earned and recoverable, not arbitrary |  |  |
| Prompt, action, evidence, consequence, and next step formed a legible loop |  |  |
| Copy Summary worked and includes run/start/input, round trace, OK/missed/false counts, net, and best record |  |  |
| Mobile HUD/text/review/feedback/Wiener speech readable |  |  |

## Debrief Answers

Fill every answer after play. The evaluator rejects blank answers and bare
verdict answers such as `pass`, `yes`, `ok`, `fail`, or `ambiguous`. It also
rejects answers that do not address the specific question. For example, the
token-boundary answer must describe a split/division/chunk boundary, and the
economy answer must name pay, cost, or net.

1. What were you trying to do when you swiped?

2. What is a token boundary, based on the game?

3. Name one way tokenization differs from ordinary word reading.

4. What made pay go up or company cost go up?

5. Did any result feel unfair or caused by input imprecision?

6. What did the AI/browser fiction make you think was happening?

7. Which screen or moment was hardest to read?

8. What made you want to keep playing or stop?

## Pass-Criteria Rollup

Use `pass`, `fail`, or `ambiguous`. Every non-empty result needs concrete
evidence or contradiction text; bare verdicts are rejected by the evaluator.
Evidence cells like `pass`, `yes`, `ok`, `fail`, or `ambiguous` are still bare
verdicts. Pass rows must name the observed behavior or concept for that
criterion: the first swipe and lack of coaching, the specific non-word
tokenization behavior, the handoff action, pay/cost/net explanation, input trust
or mistrust, mobile readable surfaces, labor-frame language, engagement plus
intentional degraded visual style, or copied-summary payload. Record the
observed action, tester quote, timing, or contradiction.
These rows are cross-checked against the Observation Notes rows for the same
behavior.

| Criterion | Result | Evidence / contradiction |
| --- | --- | --- |
| First action completed without outside instruction |  |  |
| Explains one non-word tokenization behavior |  |  |
| Selects Start Training from tutorial-complete handoff |  |  |
| Explains pay minus cost equals net |  |  |
| No systematic swipe/snap mistrust |  |  |
| Mobile readability holds on real device |  |  |
| Labor frame noticed without being told |  |  |
| Engagement and degraded visual intent observed |  |  |
| Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record |  |  |

## Follow-Up Changes

List only changes justified by observed player behavior.

- 

## Principle Evidence Notes

Use these notes when completing the principle-embodiment audit in
`docs/playtest_rollup_template.md`. The evaluator rejects blank, bare, or
generic principle notes. Each line must name concrete playtest behavior for that
principle area, not just a verdict.

- Top game design loop evidence:
- Critical/conceptual play evidence:
- Emotional design evidence:
- Game feel evidence:
- Optimal visual display evidence:
