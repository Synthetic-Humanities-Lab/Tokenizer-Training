# Tokenizer Training Pre-Port Audit - 2026-06-29

## Scope

This audit is a pre-port cleanup pass for the current Phaser/Vite Tokenizer Training repo. It focuses on redundant systems, stale visual/copy paths, mobile-touch readiness, and deletion candidates before any mobile app wrapper work.

Current Git state: `manual_tokenization_codex_context_pack/` is now a Git checkout on `main`, tracking `origin/main` at `git@github.com:Synthetic-Humanities-Lab/tokenizer-training.git`. The repo has an initial baseline commit, a product-rename commit, and a README/runbook cleanup commit. Generated/dependency/archive files remain ignored rather than tracked.

## Validation Baseline

Latest validation from `manual_tokenization_codex_context_pack/`:

- `npm run playtest:audit:local`: pass; local package ready for user-session preflight.
- `npm run playtest:audit`: expected fail; local package passes, but session evidence and completed rollup are still missing.
- `npm run test`: pass, 77 files / 656 tests.
- `npm run build`: pass, TypeScript plus Vite production build.
- `npm run generate:fixtures`: pass, regenerated 78 `cl100k_base` fixtures.

The green local package/test/build state means the current behavior is internally consistent. It does not mean the repo is lean, mobile-port-ready, or externally validated, because several tests still preserve legacy surfaces that the visible product contract no longer wants and the full playtest evidence gate is intentionally incomplete.

## Mobile Plugin Status

The Build iOS Apps / XcodeBuildMCP plugin is accessible in this chat. No Xcode project/workspace exists in this web-game repo yet, and no native wrapper has been created.

`list_sims` failed with:

```text
Failed to list simulators: xcrun: error: unable to find utility "simctl", not a developer tool or in PATH
```

Conclusion: the plugin is callable, but local simulator tooling is not ready. Mobile-wrapper work should wait until Xcode command-line tools / simulator support are available in the active environment and a wrapper target exists.

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

### 2. Hidden PlayScene UI Surfaces Removed

PlayScene no longer constructs hidden side brand, side assistant, footer, overseer, detached tutorial popup, or separate token-strip review surfaces.

The current visible play contract is:

- HUD
- playfield and static prompt lane
- one pet Wiener and one header logo Wiener
- one Wiener speech bubble
- feedback card
- bottom controls
- cut and token review evidence inside the feedback card

Recommended action: keep future mobile work inside this smaller surface set. Reintroduce a second text panel only if it has a separate product job and a tested geometry contract.

### 3. Speech System Naming Cleaned Up

The current visible behavior is one pet Wiener speech bubble. The runtime path is now named around that behavior:

- `WienerSpeechSystem.ts`
- `wienerSpeechPanel`, `wienerSpeechText`, `setWienerSpeech`
- `FeedbackSummary.wienerSpeech`
- `WienerSpeechLineSystem`
- `src/game/data/wiener_speech_lines.json`

`WienerSpeechLineSystem` remains a content selector only. It does not imply a second UI panel.

### 4. Tutorial Copy No Longer Uses Popup-Shaped Names

`TutorialSystem.ts` still owns the ten-round route, but popup-shaped names have been removed. The current naming distinguishes:

- prompt intro line
- active instruction line
- teaching explanations
- review explanation
- pass/mixed/fail review reactions

Instruction now comes from the pet Wiener speech bubble and the review pause. Detached memo-card/tutorial popup behavior should stay out of this pass.

### 5. Review Evidence Has One Visible Owner

Review token evidence now belongs to the feedback card through `FeedbackSystem.tokenSplitLine()` and `FeedbackCard.qaState()`. The old `tokenStripText` / `SegmentationEvidenceSystem` path has been removed so token evidence and cost feedback no longer compete in two visible places.

### 6. Fixture/Input Model Is Valuable and Should Not Be Rewritten

The fixture validator and input model are doing important work:

- fixtures reject token boundaries that cannot be displayed cleanly;
- playable slots avoid post-space duplicate cuts;
- release-sample and fast-swipe logic are tested;
- touch aim loupe and haptic gating already exist;
- input-feel metrics capture touch-specific evidence.

Recommended action: preserve these systems during cleanup. For mobile work, add real-device/simulator tests around them rather than replacing them.

### 7. Tests Now Assert the Current Visible Contract

Updated coverage now asserts the current visible surface contract:

- removed layout tests for deleted popup and overseer panel systems;
- renamed pet speech tests around `WienerSpeechSystem`;
- moved review token split expectations to the feedback-card QA surface;
- kept negative QA assertions that deleted surfaces are absent;
- added `docs/current_surface_contract.md` as the current browser-QA contract.

Recommended action: keep future tests contract-based. Historical browser-QA screenshots can remain as evidence of prior defects, but they should not define current UI requirements.

### 8. Docs and Artifacts Are Stale Enough to Mislead Future Work

Several older docs describe earlier builds with moving text, overseer panels, robot popups, side assistant panels, or older QA IDs. The docs are useful historical evidence, but they should not be treated as current requirements.

Addressed since the original audit:

- `README.md` is now a concise project entry point.
- Detailed playtest operations moved to `docs/playtest_operations.md`.
- The local readiness audit now requires `docs/playtest_operations.md`.
- Product-facing copy now uses `Tokenizer Training`; legacy `tokenization-training.*`, `manual-tokenization-training.*`, and `mtt-*` support remains compatibility-only.
- `.gitignore` excludes dependency/build/archive artifacts.
- `docs/current_surface_contract.md` names the authoritative current surfaces.
- `tests/browser-qa-evidence.test.ts` now checks the current contract docs instead of preserving old screenshot requirements.

Artifact/noise candidates:

- `.DS_Store` files
- `dist/` build outputs, if the real repo should not track build products
- `manual_tokenization_agent_handoff_2026-06-07.tar.gz`
- `manual_tokenization_chatgpt_single_file_context_2026-06-07.txt`
- old browser QA PNGs that encode rejected layouts, unless kept under a clearly historical folder

Recommended action: keep the README and `docs/playtest_operations.md` as the current entry points, then split older browser-QA/history docs into `current/` versus `archive/` or add a current-state index that names authoritative docs. Do not let old screenshot docs define current UI contracts.

## Cleanup Result

Completed in this pass:

- deleted detached tutorial popup layout code;
- deleted the hidden overseer panel UI;
- removed side brand, side assistant, and footer ownership from `PlayScene.ts`;
- renamed robot/comment and overseer-line runtime paths to Wiener speech naming;
- removed the separate token strip / segmentation evidence rendering path;
- moved review token split QA to `feedbackTokenSplit`.

Remaining candidates:

- drawn `drawWienerGlyph` implementation in `src/game/ui/WienerGlyph.ts`, if no current menu or test path still needs it.
- `TutorialScene.ts`: it only redirects to `PlayScene`; remove only if all launch paths go through `BootScene` or direct `PlayScene`.
- historical browser-QA files can be moved under an archive folder in a docs-only pass.

Do not delete:

- tokenizer fixture generation/validation;
- scoring/economy/rank/session persistence;
- `SwipeCutSystem`, `CutInputSessionSystem`, touch aim loupe, input metrics, or haptics;
- tutorial/endless mode structure;
- results copied-summary payload until playtest tooling no longer depends on it.

## Recommended Cleanup Sequence

1. Complete: restore a real Git working tree and push it to GitHub.
2. Complete: product rename in constants, `index.html`, visible copy, tests, copied summaries, and current docs.
3. Complete: renamed the pet speech path and kept `WienerSpeechLineSystem` as a content selector only.
4. Complete: deleted hidden side/footer/assistant/overseer/tutorial-popup PlayScene surfaces.
5. Complete: renamed tutorial content away from popup terminology.
6. Complete: made the feedback card the single review evidence owner.
7. Complete: updated QA snapshots/tests to assert current surfaces only.
8. Run `npm run generate:fixtures`, `npm run test`, and `npm run build`.
9. Only then start mobile wrapper work with XcodeBuildMCP.

## Chat Strategy

Use this chat for cleanup if the next task is narrow: rename product constants, delete one hidden surface, or simplify one copy system.

Start a new chat for the mobile app port after cleanup. The mobile port will need a compact handoff context: current repo state, validation commands, Xcode/plugin status, target wrapper choice, touch acceptance criteria, and known real-device risks. Keeping that separate will prevent old visual-pass context from steering native/mobile decisions.

## Immediate Next Step

Validate the cleanup pass, then run a fresh browser smoke at desktop, portrait phone, and small-phone viewports. Mobile wrapper work should start only after those checks are green and the local Xcode simulator tooling is available.
