# Current Surface Contract

This document records the current Tokenizer Training browser contract for QA and cleanup work. Historical browser-QA logs and PNGs remain useful as evidence of prior problems, but they are not current layout requirements.

## Current Visible Surfaces

- HUD: balance, pay, cost, rank progress, timer, best record, and visible WienerWorks logo.
- playfield: static prompt lane, legal-slot guides, active cut markers, resolved cut labels, swipe trail, and falling resolved text pieces.
- Mascot: one pet Wiener in the play scene, plus one small header logo Wiener.
- Speech: one pet speech bubble sourced through `WienerSpeechSystem`.
- Feedback card: the canonical review surface for technical result text, feedback-card token split, economy line, and cut audit.
- Controls: bottom control row containing Sound, Exit, Clear, and Resolve or Continue.
- QA geometry: only current visible surfaces and input affordances should be exposed, with compatibility mirrors limited to external QA IDs where explicitly required.

## Removed Surfaces

These should not be constructed, laid out, or asserted as hidden runtime UI:

- side brand panel
- side assistant panel
- footer panel
- overseer panel
- detached tutorial popup
- separate token strip
- separate segmentation evidence card

## Review Evidence

Review token evidence belongs to the feedback card. The old token-strip path was removed to avoid duplicate token/cost explanations competing with Wiener speech and the feedback card.

## Tutorial Speech

Tutorial copy is delivered by Wiener speech and the review pause. Content fields should describe speech, teaching explanations, and review explanations, not popup windows.
