# Tokenizer Training Pre-Port Audit - 2026-06-29

## Scope

This audit is a pre-port cleanup pass for the current Phaser/Vite Tokenizer Training context pack. It focuses on redundant systems, stale visual/copy paths, mobile-touch readiness, and deletion candidates before any mobile app wrapper work.

The working directory is not a Git checkout. `git status --short` fails at both the workspace root and `manual_tokenization_codex_context_pack/` with `fatal: not a git repository`. Treat this folder as a context pack until it is moved back into a real repository.

## Validation Baseline

Commands run from `manual_tokenization_codex_context_pack/`:

- `npm run test`: pass, 77 files / 653 tests.
- `npm run build`: pass, TypeScript plus Vite production build.
- `npm run generate:fixtures`: pass, regenerated 78 `cl100k_base` fixtures.

The green test/build state means the current behavior is internally consistent. It does not mean the repo is lean or port-ready, because several tests still preserve legacy surfaces that the visible product contract no longer wants.

## Mobile Plugin Status

The Build iOS Apps / XcodeBuildMCP plugin is accessible in this chat. `session_show_defaults` returned successfully, but no project, workspace, scheme, simulator, or bundle id is configured.

`list_sims` failed with:

```text
Failed to list simulators: xcrun: error: unable to find utility "simctl", not a developer tool or in PATH
```

Conclusion: the plugin is callable, but local simulator tooling is not ready. Mobile-wrapper work should wait until Xcode command-line tools / simulator support are available in the active environment.

## Current Architecture Snapshot

- `src/game/scenes/PlayScene.ts` is 4,633 lines, roughly the center of all runtime coupling.
- The tokenizer fixture pipeline is strong: fixtures reject unplayable post-space boundaries, standalone blank separator tokens, byte boundaries inside graphemes, and adjacent space duplicates.
- Touch-adjacent input systems already exist and should be preserved:
  - `CutInputSessionSystem.ts`
  - `SwipeCutSystem.ts`
  - `TouchAimLoupeSystem.ts`
  - `InputFeelMetricsSystem.ts`
  - `HapticFeedbackSystem.ts`
- Runtime identity is now centralized:
  - `package.json` is `tokenizer-training`.
  - canonical storage keys, QA ids, summary filenames, and run id prefixes use `tokenizer-training` / `tt`.
  - compatibility readers/mirrors remain for `tokenization-training.*`, `manual-tokenization-training.*`, and legacy `mtt-*` run ids.

## Main Findings

### 1. Product Rename Checkpoint

`src/game/systems/ProductIdentitySystem.ts` now exports:

```ts
export const PRODUCT_NAME = "Tokenizer Training";
```

`index.html`, package metadata, visible menu/results copy, generated summaries, and current QA/storage IDs now use `Tokenizer Training`.

This should stay fixed before mobile packaging because page title, WebView accessibility label, QA ids, copied summaries, and wrapper metadata should not disagree.

Recommended action: preserve the compatibility readers while deleting unrelated stale UI systems in later cleanup passes.

### 2. PlayScene Owns Too Many Dead or Hidden UI Systems

`PlayScene.ts` still constructs and updates legacy surfaces that current layout flags hide:

- side brand panel: `brandPanel`, `layoutBrandPanel`
- side assistant panel: `assistantPanel`, `layoutAssistantArtifact`, `assistantPanelText`
- footer panel: `trainingFooterGraphics`, `refreshTrainingFooter`
- overseer panel: `OverseerPanel`, `computeOverseerPanelLayout`
- tutorial popup shell: `tutorialPopup*`, `showTutorialPopup`, `layoutTutorialPopup`

`PlayLayoutSystem.ts` now hardcodes `sideAssistant = false`, `sideBrandPanel = false`, and `footerHeight = 0`. The runtime still pays the complexity cost for these hidden paths.

Recommended action: delete hidden side/footer/assistant/tutorial-popup surfaces in stages. Keep only the visible HUD, playfield, pet Wiener, pet speech bubble, feedback card, controls, token/cut evidence, and QA geometry needed for those surfaces.

### 3. Speech System Is Conceptually Right but Poorly Named

The current visible behavior is one pet Wiener speech bubble, but the implementation still uses robot/overseer names:

- `RobotCommentSystem.ts`
- `robotToastPanel`, `robotToastText`, `setRobotComment`, `showRobotToast`
- `FeedbackSummary.overseer`
- `OverseerLineSystem`
- `src/game/data/overseer_lines.json`

Some of this is only naming debt, but naming matters here because bugs have repeatedly come from two or more supposed speech sources competing onscreen.

Recommended action: rename the live system to `PetSpeechSystem` or `WienerSpeechSystem`, rename runtime fields from `robotToast*` to `petSpeech*`, and decide whether `OverseerLineSystem` remains as a content selector only. If it remains, it should not imply a second UI panel.

### 4. Tutorial Copy Still Carries the Old Popup Timeline

`TutorialSystem.ts` has ten rounds, and each round still carries many popup-specific fields:

- `popupBody`
- `mechanicsPopupBody`
- `bytePopupBody`
- `tokenIdPopupBody`
- `rulePopupBody`
- `followupPopupBody`
- `resolvePopupBody`
- matching line fields

The current product direction is not separate memo-card/tutorial popup behavior; instruction should come from the pet Wiener and review pause. The code has already made `showTutorialPopup` hide the popup and mirror body copy into Wiener speech, which means the old data shape is misleading.

Recommended action: collapse tutorial content into a smaller script surface:

- prompt intro line
- active instruction line
- optional teaching explanation
- review explanation
- pass/mixed/fail reaction

Keep the existing tutorial facts, but remove popup-oriented field names after tests are updated.

### 5. Review Evidence Exists in Two Places

The visible feedback card now includes token split text through `FeedbackSystem.tokenSplitLine()`, and the old `tokenStripText` / `SegmentationEvidenceSystem` path still exists for staged review evidence and QA.

This has produced exactly the visual confusion the user reported: one card explains cost and another area explains tokenization. The code currently works, but the ownership is not clear.

Recommended action: pick one canonical review-evidence component. Prefer folding the visible token split into `FeedbackCard` and keeping any separate `tokenStripText` only as a hidden QA/transition implementation detail, or deleting it entirely after QA exposes feedback-card token split geometry.

### 6. Fixture/Input Model Is Valuable and Should Not Be Rewritten

The fixture validator and input model are doing important work:

- fixtures reject token boundaries that cannot be displayed cleanly;
- playable slots avoid post-space duplicate cuts;
- release-sample and fast-swipe logic are tested;
- touch aim loupe and haptic gating already exist;
- input-feel metrics capture touch-specific evidence.

Recommended action: preserve these systems during cleanup. For mobile work, add real-device/simulator tests around them rather than replacing them.

### 7. Tests Are Green but Some Tests Preserve Stale Concepts

Examples:

- `tests/tutorial-popup-layout.test.ts` still validates popup layout.
- `tests/overseer-panel.test.ts` still validates the hidden overseer panel.
- `tests/robot-comment.test.ts` validates a robot-named system that is actually pet speech.
- `tests/browser-qa-evidence.test.ts` and older docs repeatedly encode stale popup/overseer/moving-text screenshots.
- `tests/menu-scene-qa.test.ts`, `tests/results-scene-qa.test.ts`, and `tests/session-flow.test.ts` still expect old manual-product copy in places.

Recommended action: update tests by contract, not by deleting coverage. Replace hidden-surface tests with assertions that only the intended UI surface exists and that pet speech, feedback, touch targets, and review evidence remain non-overlapping.

### 8. Docs and Artifacts Are Stale Enough to Mislead Future Work

Several docs describe earlier builds with moving text, overseer panels, robot popups, side assistant panels, or old product naming. The docs are useful historical evidence, but they should not be treated as current requirements.

Artifact/noise candidates:

- `.DS_Store` files
- `dist/` build outputs, if the real repo should not track build products
- `manual_tokenization_agent_handoff_2026-06-07.tar.gz`
- `manual_tokenization_chatgpt_single_file_context_2026-06-07.txt`
- old browser QA PNGs that encode rejected layouts, unless kept under a clearly historical folder

Recommended action: split docs into `current/` versus `archive/`, or add a current-state index that names the authoritative docs. Do not let old screenshot docs define current UI contracts.

## Deletion Candidates

Do not delete all of these at once. Delete in small passes with tests after each pass.

High-confidence candidates after type/test migration:

- drawn `drawWienerGlyph` implementation in `src/game/ui/WienerGlyph.ts`; keep or move only the mood type if still needed.
- `TutorialPopupLayoutSystem.ts` and `tutorialPopup*` scene fields if no visible tutorial popup is reintroduced.
- `OverseerPanel.ts` and `computeOverseerPanelLayout` if the bottom/side overseer panel remains permanently removed.
- side brand panel construction/layout in `PlayScene.ts`.
- side assistant panel construction/layout in `PlayScene.ts`.
- training footer construction/layout in `PlayScene.ts`.

Conditional candidates:

- `OverseerLineSystem.ts` and `src/game/data/overseer_lines.json`: keep if used as randomized Wiener line source; rename if kept.
- `tokenStripText` / `SegmentationEvidenceSystem`: keep only if it remains the canonical review evidence, otherwise fold into feedback-card QA.
- `TutorialScene.ts`: it only redirects to `PlayScene`; can be removed if all launch paths go through `BootScene` or direct `PlayScene`.

Do not delete:

- tokenizer fixture generation/validation;
- scoring/economy/rank/session persistence;
- `SwipeCutSystem`, `CutInputSessionSystem`, touch aim loupe, input metrics, or haptics;
- tutorial/endless mode structure;
- results copied-summary payload until playtest tooling no longer depends on it.

## Recommended Cleanup Sequence

1. Restore a real Git working tree or put this context pack under Git before deleting anything.
2. Complete the product rename in constants, `index.html`, visible copy, tests, copied summaries, and docs marked current.
3. Extract/rename the pet speech path:
   - `RobotCommentSystem` -> pet/Wiener speech naming;
   - `robotToast*` -> `petSpeech*`;
   - remove the hidden overseer UI panel if no longer visible.
4. Delete hidden side/footer/assistant PlayScene surfaces, one group per commit/pass.
5. Collapse tutorial content fields away from popup terminology.
6. Decide the single review evidence owner and remove the redundant visible/hidden token strip confusion.
7. Update QA snapshots/tests to assert current surfaces only.
8. Run `npm run generate:fixtures`, `npm run test`, and `npm run build`.
9. Only then start mobile wrapper work with XcodeBuildMCP.

## Chat Strategy

Use this chat for cleanup if the next task is narrow: rename product constants, delete one hidden surface, or simplify one copy system.

Start a new chat for the mobile app port after cleanup. The mobile port will need a compact handoff context: current repo state, validation commands, Xcode/plugin status, target wrapper choice, touch acceptance criteria, and known real-device risks. Keeping that separate will prevent old visual-pass context from steering native/mobile decisions.

## Immediate Next Step

The most useful first code pass is not the mobile port. It is a small cleanup PR/pass:

1. Keep the `Tokenizer Training` identity checkpoint stable while deleting stale UI surfaces.
2. Rename robot/toast internals to pet speech without changing behavior.
3. Delete the hidden tutorial popup UI objects if tests confirm they never render.

That gets the game closer to a single coherent surface before touch-specific packaging.
