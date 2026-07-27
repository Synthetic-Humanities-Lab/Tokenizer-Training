# Tokenizer Training Experience Iteration Log

Each entry represents an integrated whole-game pass, not a small compliance fix.

Record:

- baseline weakness and player consequence;
- coherent hypothesis spanning the journey;
- visible, audible, and interactive changes;
- before/after browser and simulator evidence;
- focused and milestone validation;
- observed gains, regressions, and unknowns;
- keep, revise, or revert decision;
- next pass chosen in response to evidence.

## Pass 0 - Baseline

Status: complete; Casework Shift selected

### Player Consequence

- Home is visually clean, but the first active instruction begins with procedure and does not establish why a human is doing the work.
- The phone playfield gives comparable weight to prompt, HUD, speech, Wiener, guides, status copy, rails, and controls.
- Cuts are acknowledged by overlapping visual, mascot, haptic, and repeated oscillator responses. Resolution adds another stacked sequence and delays continuation.
- Review reports truth but provides little forward transfer; Results offers generic replay; Token Log reads as a dense reference.

### Evidence

- Fresh iOS baseline: `.qa/experience/pass-0-baseline/ios/`.
- Fresh iOS web build and XcodeBuildMCP build/run passed.
- Current live localhost server returned HTTP 200.
- Managed Chromium capture failed at macOS Mach-port registration. No fresh browser image claim is made.
- Simulator canvas descendants were not actionable through `snapshot_ui`; no physical gesture, audio, haptic, or complete automated journey claim is made.

### Selected Integrated Hypothesis

Casework Shift: establish human takeover through reactive Wiener instruction during play, simplify active action feedback, strengthen dry procedural sound identity, separate clean/error review cadence, and convert errors into one next-prediction cue. Preserve the approved home composition and avoid detached onboarding panels.

### Pass 1 Acceptance

- The first tutorial instruction states role, action, and submission without delaying input.
- First cut changes instruction once, then leaves the prompt visually dominant.
- Mobile active HUD and status layers no longer compete equally with the prompt.
- One cut produces one dominant audible/visual response; multi-cut escalation is bounded.
- Resolution does not stack five near-simultaneous judgement cues.
- Clean Training review advances materially faster than error review; Tutorial retains learning dwell.
- Review provides one actionable next cue without duplicating token evidence.
- Small phone, standard phone, large phone, desktop, and current iOS candidate remain playable.

## Pass 1 - Casework Shift

Status: complete; keep

### Integrated Changes

- Replaced procedural-first tutorial copy with a compact human-labour takeover line that fits the actual phone speech budget; the first accepted cut changes Wiener once, while ordinary Training speech clears after cutting begins.
- Reduced active mobile HUD to balance and time plus the existing progress rail. Best returns during review; pay/cost evidence remains in the canonical feedback card.
- Removed persistent cut labels, staged counts, action-word badges, control count suffixes, per-cut Wiener reactions, and duplicate chain rails while retaining cut geometry, snap guidance, metrics, and QA state.
- Reworked oscillator audio into short paper/relay voices, escalated multi-cut confirmation, collapsed resolution to one judgement cue, and removed premature miss sound/haptics from uncommitted aim slips.
- Made clean Training reviews advance from a 1.5 second base while error and Tutorial reviews retain reading time. Review Wiener speech now carries one next-prediction cue.

### Evidence And Validation

- Fresh simulator frames: `.qa/experience/pass-1/ios/`.
- Focused integration validation: 11 files, 209 tests passed; TypeScript and `git diff --check` passed.
- `npm run build:ios-web` and XcodeBuildMCP build/install/launch passed on iPhone 17, iOS 26.5.
- Simulator screenshots verify presentation and timing states, not physical swipe feel, audible quality, haptic quality, or complete automated navigation.

### Observed Gains

- The first active phone state now communicates premise, action, prompt, and controls without a detached tutorial surface.
- The prompt owns more of the visual field and review no longer begins with six equal-weight HUD metrics.
- Wiener remains present at instruction and judgement moments but no longer comments on every cut.

### Remaining Weaknesses

- Token numbers appear in review evidence but not in the physical split, so the numerical dimension still feels retrospective.
- Token Log rows are factually strong but visually dense and too small on phone.
- Results has a readable four-card summary but does not identify the most useful recovery action.
- Authored physical-device listening and touch play remain required before final acceptance.

### Pass 2 Selection

Resolved Cases: add truthful token-ID identity only to falling fragments that exactly match real tokens, turn Token Log into a clearer reviewed/reference case archive, and add a cause-specific Results recovery cue without adding metric cards.

## Pass 2 - Resolved Cases

Status: complete; keep, with split-motion capture carried into Pass 3

### Integrated Changes

- Falling submitted pieces receive a real `cl100k_base` ID only when their exact grapheme span equals one whole fixture token. False-cut fragments and pieces spanning a missed token boundary remain deliberately unnumbered.
- Token Log distinguishes reviewed and reference cases, then renders each ordered token directly above its fixture-backed ID instead of wrapping one small diagnostic string.
- Results appends a bounded recovery cue selected from missed-dominant, false-dominant, mixed, or clean performance without adding another metric card.

### Evidence And Validation

- Fresh simulator frames: `.qa/experience/pass-2/ios/`.
- Focused integration validation: 7 files, 86 tests passed for split identity, PlayScene integration, Token Log, and Results recovery; the revised token-cell view then passed its 23 focused tests. TypeScript passed after integration.
- `npm run build:ios-web` and XcodeBuildMCP build/install/launch passed on iPhone 17, iOS 26.5.
- The Phaser canvas remains one accessibility element in WKWebView. Exact-span behavior is tested, but the new ID label has not yet been accepted from a precise in-motion simulator frame.

### Observed Gains

- The numerical dimension is now attached to physical consequence rather than presented only after the fact.
- Token Log makes token-to-ID correspondence scannable at phone size while retaining source/category provenance.
- Results names a useful next study target and keeps the budget-failure summary to four cards.

### Remaining Weaknesses

- Tutorial mode begins directly in play when launched from the approved menu; the first speech is concise, but the reassignment premise still lacks a deliberate clock-in beat.
- Results recommends Token Log but still prioritizes `Copy Summary`, an operator action with little consumer-game value.
- Simulator automation cannot target exact Phaser cut coordinates, blocking visual acceptance of the split/ID composition.

### Pass 3 Selection

Clock-In And Recovery: add one fast tutorial intake surface, route Results directly into Token Log, and add a DEBUG/native-only exact-cut scenario for autonomous simulator acceptance.

## Pass 3 - Clock-In And Recovery

Status: complete; keep for user review

### Integrated Changes

- Tutorial selection now opens one manual-assignment intake rather than dropping the player directly into an unexplained shift. It states the automation failure and human reassignment, names `cl100k_base`, gives Wiener one attached snarky instruction, and reduces the work rhythm to read, slice, and submit.
- Removed the first intake draft's decorative `wienerworks://...` path bar after simulator review; retained one compact failure status and one dominant `Clock In` action.
- Replaced Results' primary `Copy Summary` action with `Review Token IDs`, directly aligning the failure cue with the factual recovery surface. The detailed playtest summary remains available to QA state rather than occupying consumer UI.
- Added a DEBUG/native-only exact-cut launch scenario. It validates fixture and grapheme cut indexes, stages cuts, resolves, and can hold the real split pieces while suppressing the review card. Release iOS removes QA query controls; browser production does not enable them.

### Evidence And Validation

- Fresh simulator frames: `.qa/experience/pass-3/ios/`.
- The held `simple_001` resolution frame shows IDs 1820, 8415, 7731, 389, 279, and 5634 on their exact token pieces.
- Intake frames passed visual review on iPhone 17e, iPhone 17, and iPhone 17 Pro Max. The installed runtime has no iPhone SE simulator; focused 375x667 layout tests cover its geometry.
- Milestone checks passed: 78 regenerated fixtures, 122 test files / 1,197 tests, browser production build, iOS web build, local playtest package audit, and current Xcode Debug builds.
- Automated browser image capture hung at the known managed Chromium/macOS boundary and was stopped. HTTP and production-build health passed; no fresh desktop image is claimed.

### Observed Gains

- The player is now explicitly a human employee taking over an AI-adjacent tokenization task before the first tutorial swipe.
- Wiener is framed as shift lead and auditor without becoming an assistant panel or mascot chatter layer.
- The numerical dimension appears at physical resolution, persists as readable case evidence, and is reachable directly from failure.
- QA can now verify exact cut consequences in Simulator without changing release input behavior.

### Remaining Human-Play Risks

- Procedural audio passed code tests but still needs listening on speakers/headphones; no automated check establishes that the paper/relay voices feel satisfying.
- Simulator automation verifies exact state, not finger ergonomics, haptic quality, or whether fast multi-cut swipes feel as direct as Fruit Ninja.
- The complete ten-case tutorial should be played end to end to judge fatigue, repetition, and whether the explicit intake plus in-round Wiener guidance is one explanation too many.
- Token IDs are legible while held; their readability during the normal falling motion remains a perceptual judgment.

### Decision

Keep the three-pass candidate and stop for review. Further work should begin from a real play judgment, not another speculative feature or compliance pass.
