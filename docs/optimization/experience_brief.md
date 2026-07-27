# Tokenizer Training Experience Brief

Last updated: 2026-07-18
Phase: Three-pass review milestone
Pass: 3 of at least 3 integrated whole-game passes

## North Star

Tokenizer Training should feel like Fruit Ninja applied to real tokenization inside WienerWorks: a Claude-like, obsolete AI-work interface where the player is a human employee taking over an automated task. Wiener supplies snark, pressure, and useful diagnosis. The player learns tacitly by predicting, acting, seeing consequences, inspecting canonical evidence, and recovering examples in Token Log.

## Non-Negotiable Truth

- All token boundaries, chunks, and IDs must remain accurate to the named encoding.
- Fiction, mechanics, presentation, progression, economy, pacing, dialogue, sound, and modes may change when the integrated experience improves.
- Research supports design decisions; it is not a substitute for playable change.
- Player-facing material change is the unit of progress.

## Current Diagnosis After Pass 1

- The current build is robust and heavily validated, but the last optimization phase overproduced platform, evidence, and semantic infrastructure relative to visible game transformation.
- Pass 1 now states the human-takeover premise in the first playable speech bubble and changes it after the first cut rather than adding a detached onboarding screen.
- Mobile active HUD is reduced to balance, time, and a progress rail; staged-count labels, action-word badges, per-cut Wiener reactions, and duplicate chain rails no longer compete with the prompt.
- Cut sounds now escalate across a short swipe; resolution produces one judgement cue plus an optional low-balance warning. Clean Training review is materially faster than error review.
- Review remains the canonical factual evidence and now carries a bounded next-prediction cue through Wiener.
- Token IDs are visible in review and Token Log, but they are not yet embodied in the physical resolution moment.
- Token Log remains too dense on phone, and Results does not yet turn failure into a specific recovery action.

## Pass 1 - Casework Shift

Make the first cut establish the premise: automation is unavailable and the player is the human tokenizer. Preserve the approved home composition and avoid a separate memo screen. Use reactive Wiener instruction inside play, simplify active feedback to one decisive response per action, reduce mobile HUD/playfield competition, give review one bounded next cue, and make clean rounds move faster than error rounds.

Pass 1 is successful only if it creates a visible, audible, and temporal difference in the playable loop. It must not add explanatory panels or replace token evidence with narration.

Decision: keep. Focused Pass 1 validation passed 209 tests plus TypeScript. Fresh simulator frames are stored under `.qa/experience/pass-1/ios/`.

## Pass 2 - Resolved Cases

Make numerical token identity part of the consequence without falsifying it. A falling player-made fragment may show a real token ID only when its exact span equals one complete fixture token; false-cut fragments and pieces spanning missed boundaries remain unnumbered. Reframe Token Log as reviewed/reference cases with a clearer phone hierarchy, and give Results one cause-specific Token Log recovery cue without adding metrics.

Pass 2 succeeds if correct physical cuts visibly become numbered tokens, incorrect fragments never inherit fabricated IDs, Token Log mappings can be scanned at phone size, and Results points toward a relevant recovery action without crowding the four-card budget summary.

Decision: keep, with the falling-piece composition still awaiting a precise simulator capture. Exact-span token identity, false/missed-boundary failure cases, Unicode spans, and invalid data are covered by focused tests. Token Log now renders each ordered token directly above its real ID in bounded evidence cells, and Results names the dominant recovery need without adding metrics. Fresh phone frames are under `.qa/experience/pass-2/ios/`.

## Pass 3 - Clock-In And Recovery

Make the role framing and recovery loop feel like one game rather than adjacent tools. Tutorial selection should open a concise WienerWorks intake where an automation failure reassigns the player to manual tokenization; Wiener supplies the only character voice and the player can clock in immediately. Results should route its first action to the factual Token Log instead of prioritizing an operator-oriented copy action. Add narrowly gated simulator input control so exact cuts and their token-ID consequence can be captured without weakening production play.

Pass 3 succeeds if the premise is unambiguous before the first tutorial swipe, onboarding remains one fast screen rather than a lecture, Results offers a useful recovery action, and the real split/ID effect can be inspected in the current iOS build.

Decision: keep for review. The approved menu now leads to one concise manual-assignment intake with a single automation-failure signal, Wiener-attached speech, a three-step work rhythm, and a dominant `Clock In` action. Results routes its first action to `Review Token IDs`. A DEBUG/native-only exact-cut harness captured all six truthful `simple_001` token IDs in the iOS shell; release iOS blocks QA query controls and browser production does not enable them.

## Model Routing

- Sol High: orchestrator, product synthesis, integration, acceptance.
- Terra High: judgment-heavy game/UX design and substantial implementation.
- Luna Medium: deterministic audits, extraction, tests, builds, and captures.
- Sol Ultra: exceptional synthesis or final adversarial review only; record the reason before use.

## Pass Board

| Pass | Integrated hypothesis | Player-facing scope | Status | Decision |
|---|---|---|---|---|
| 0 | Truthful baseline and ranked diagnosis | Whole journey | Complete | Casework Shift selected |
| 1 | Human role + singular action feedback + recovery cue | Whole journey | Complete | Keep |
| 2 | Truthful token-number resolution + case archive + recovery | Whole journey | Complete | Keep; capture split motion in Pass 3 |
| 3 | Clock-in premise + direct recovery + autonomous cut capture | Whole journey | Complete | Keep for user review |

## Current Evidence Boundary

- Fresh iPhone 17 / iOS 26.5 menu, tutorial-active, review-transition, Results, Token Log, and failure frames are under `.qa/experience/pass-0-baseline/ios/`.
- Fresh Pass 1 menu, tutorial-active, tutorial-review, Training-active, Results, and Token Log frames are under `.qa/experience/pass-1/ios/`.
- Fresh Pass 2 Token Log, Results, and no-cut review frames are under `.qa/experience/pass-2/ios/`.
- Fresh Pass 3 tutorial intake, truthful resolved-token IDs, Results recovery, iPhone 17e, and iPhone 17 Pro Max frames are under `.qa/experience/pass-3/ios/`.
- `npm run build:ios-web` and XcodeBuildMCP build/run passed for the fresh baseline bundle.
- The localhost server is healthy, but managed Chromium still fails at Mach-port registration. Fresh browser screenshots are therefore missing, not passed.
- Canvas controls are not exposed through the simulator accessibility snapshot, so the baseline uses representative direct routes and timed natural resolution rather than claiming a complete automated gesture journey.
- Browser, simulator, and automated checks do not replace human play, authored-audio listening, or physical-device feel.

## Milestone Validation

- `npm run generate:fixtures`: passed; 78 `cl100k_base` fixtures regenerated.
- `npm run test`: passed; 122 files and 1,197 tests.
- `npm run build`: passed.
- `npm run build:ios-web`: passed.
- `npm run playtest:audit:local`: passed; the local package is ready for user-session preflight.
- XcodeBuildMCP built, installed, and launched the current Debug shell on iPhone 17e, iPhone 17, and iPhone 17 Pro Max.
- `mobile:capture` remained blocked at the managed Chromium/macOS launch boundary and was terminated after producing no frames. The localhost desktop harness and tutorial-intake route both returned HTTP 200; no fresh browser screenshot claim is made.
- This Xcode runtime does not provide an iPhone SE simulator. The 375x667 intake geometry is covered by focused tests, not a device frame.

## Next Action

Review the three-pass candidate in browser and Simulator. The next implementation pass should respond to actual play: especially physical swipe feel, authored-audio quality, tutorial pacing across all ten cases, and whether token IDs remain legible during motion. Do not restart infrastructure expansion before that play judgment.
