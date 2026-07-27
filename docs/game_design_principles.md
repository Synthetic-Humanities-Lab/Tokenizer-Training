# Game Design Principles For Tokenizer Training

This document derives working principles from the reading notes and turns them
into standards for the playable vertical slice.

## Top Game Design

1. Make the core loop a complete thought: prompt, prediction, evidence,
   consequence, continuation.
2. Give every system one clear job and one clear interface to the loop.
3. Let difficulty come from mastery of the actual subject, not imported hazards.
4. Keep player action space visible; the player should know what can be done.
5. Make outcomes auditable; a surprising result must become explainable.
6. Tune reward and penalty as learning pressure, not as decorative score.
7. Preserve pacing across loop frequencies: gesture, round, session, metagame.
8. Test design claims with play, screenshots, and observed comprehension.
9. Let the live queue become overtly inhuman: shorten every endless deadline
   toward a hard floor while fixture content advances through a stable curriculum.

## Critical And Conceptual Play

1. Make rules express the critique.
2. Use the player role as part of the argument.
3. Let institutional pressure emerge from Token Credits, rank, and Wiener behavior.
4. Keep satire subordinate to interaction; jokes should not replace diagnosis.
5. Estrange ordinary language so tokenization becomes a felt rule system.
6. Avoid lore dumps. The critique should be legible through repeated work.

## Emotional Design

1. Give the player ownership over action and error.
2. Use tension, irritation, and recovery deliberately.
3. Make Wiener a social pressure source with useful information.
4. Let competence feel earned through better prediction, not through praise.
5. Keep failure reversible at the round level and consequential at the session
   level.
6. Make touch and timing matter because bodily input is the bridge to abstraction.

## Game Feel

1. Register input immediately and visibly.
2. Snap consistently to the same boundary model used for scoring.
3. Preserve player cuts until resolution.
4. Distinguish correct, missed, and false cuts through color, label, and timing.
5. Keep the static prompt centered and clear enough to support precision.
6. Use sound as state evidence, not spectacle.
7. Test feel on mouse and touch because occlusion and precision differ.

## Optimal Visual Display

1. Show the data before showing the decoration.
2. Keep verified credits, rework, net, token count, cuts, and timer numerically honest.
3. Use visual density only when it supports comparison.
4. Keep background chrome low-contrast and noncompetitive with text.
5. Make resolved cut markers multifunctional: position, error class, and label.
6. Preserve stable dimensions for HUD, controls, text panel, and feedback card.
7. Treat ugly enterprise style as an aesthetic constraint, not an excuse for
   poor spacing or illegible typography.

## Current Embodiment In The Game

- Core loop: implemented through fixture-backed rounds, swipe cuts, resolution,
  feedback, Token Credits, and progression.
- Critical frame: implemented through WienerWorks human-segmentation framing,
  exact-token/rework economy, rank names, disabled-help bureaucracy, and terse
  Wiener voice.
- Educational structure: implemented through four new-hire orientation pages, a
  ten-round tutorial, and safe tokenizer fixtures that expose chunk vocabularies,
  token IDs, spaces, punctuation, dense strings, and economy. Active and review
  instruction stays in Wiener speech, complete-token IDs appear on valid falling
  pieces, and the feedback card and Token Log carry resolved evidence.
- Endless progression: rounds 1-3 use plain language, 4-7 punctuation and
  numbers, 8-12 URLs/code/identifiers, and 13+ spaces, Unicode, and symbols.
  Deadlines decay from 10 seconds toward 1.8 seconds; fixture choice rotates
  categories deterministically within the current tier so difficulty is not
  decided by an unlucky random draw.
- Game feel: implemented through pointer-based swipe input, trails, persistent
  markers, cut clearing, timer pressure, prompt-acquisition feedback, feedback
  sounds, and review reveal.
- Visual display: implemented through one shared browser/iOS runtime, a mobile
  `CREDITS` / `TIME` / `BEST RUN` HUD with fuller browser HUD allowance, resolution
  labels, and one feedback card whose token, economy, and cut rows are visible
  while its generated technical descriptor remains hidden. Play controls stay
  in `Sound`, `Clear`, `Exit`, `Resolve` order.

## Remaining Design Risks

- The fixture corpus is broader for first playtest, but mastery and repetition
  still need validation over real sessions.
- Mobile touch needs direct screenshot and playtest evidence, not only layout
  tests.
- The critical frame is present but could still read as surface copy unless
  user playtests confirm that credit pressure and labor satire come through.
- Economic tuning is plausible but not yet validated against real player
  behavior.
- Tufte-style display integrity requires browser screenshots of active and
  review states to prove the interface remains readable under real rendering.
