# Tokenizer Training Experience Research Log

Use this log only for research that changes a concrete game decision.

For each entry record:

- question being decided;
- source and relevant claim;
- evidence strength and limits;
- project-specific inference;
- treatment accepted, rejected, or queued;
- player-facing surface affected.

## New-Phase Entries

### Pass 0 - Role, Loop, and Game Feel

- Question: why does a mechanically legible build still feel like a tool rather than a game about human takeover?
- Sources: local [Swink notes](../game_design_reading_notes/swink_game_feel.md), local [Zubek notes](../game_design_reading_notes/zubek_elements_of_game_design.md), and the connected Drive source PDFs for *Game Feel* and *Elements of Game Design*.
- Finding: Swink supports immediate, predictable response with a stable spatial context; Zubek supports an interacting system of player action, visible state, consequence, and repeatable learning.
- Project inference: the swipe is already expressive, but redundant labels, pulses, mascot motion, and near-identical tones divide ownership of the moment. Human-worker framing must enter through the loop, not a lore panel.
- Decision: keep the core swipe; make the first playable instruction establish role and action; reduce each action to one dominant response.

### Pass 0 - Direct-Action and Clutter Comparisons

- Sources: [Halfbrick's Fruit Ninja guide](https://www.halfbrick.com/blog/the-ultimate-beginners-guide-to-fruit-ninja), [Fruit Ninja GDC session](https://gdcvault.com/play/1016263/The-Rise-and-Rise-of), and [Supergiant's Hades patch notes](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/).
- Finding: the useful comparison is not spectacle but one-verb purity, deliberate swipe ownership, directional response, and consolidation of successive signals.
- Limits: these products do not establish Tokenizer Training's exact interface or educational treatment.
- Decision: keep a quiet aim state, one immediate cut mark, restrained escalation for multi-cut swipes, one judgement cue, and faster clean-round continuation.

### Pass 0 - Educational Recovery

- Source: [Corral, Carpenter, and St. Hilaire 2023](https://link.springer.com/article/10.3758/s13423-023-02268-4) plus the existing project learning-science log.
- Finding: prediction plus feedback and later analogous attempts is a stronger basis than explanation alone; passive review is not proof of retrieval practice.
- Decision: tutorial may explain purpose explicitly, but review should provide one bounded next cue tied to the observed error and then return the player to an analogous prediction. Token Log remains deeper factual evidence.

### Pass 2 - Numerical Identity As Consequence

- Question: how can token IDs become educational without turning active play into a table lookup?
- Project evidence: fixture token strings and IDs provide a complete `cl100k_base` mapping, while arbitrary player fragments do not necessarily correspond to one token.
- Decision: attach an ID only when a submitted piece's exact grapheme span equals one fixture token. Leave false fragments and missed-boundary composites unnumbered. Present all ordered pairs later in Token Log.
- Player-facing result: numerical identity appears as earned consequence first and reference evidence second; correctness is never inferred from a substring label.

### Pass 3 - Premise Before Procedure

- Question: should the human-takeover frame remain only in first-round speech or receive a deliberate onboarding beat?
- Evidence used: Pass 1 simulator review showed that compact in-round speech improved procedure but still made the reassignment premise easy to miss; Zubek's action-state-consequence framing supports establishing the player's role before asking them to interpret system state.
- Decision: add one skippable clock-in surface, not a tutorial lecture. State failure and reassignment, let Wiener name the boundary task, then move immediately into the existing prediction loop.
- Revision from visual QA: remove decorative route chrome and distinguish Wiener speech from system prose with an attached speech surface.

### Pass 3 - Recovery Action Over Export Utility

- Question: what should Results make easiest after a failed run?
- Evidence used: the cause-specific cue already directed the player to Token Log, while the first button still exported a diagnostic summary.
- Decision: make `Review Token IDs` the first Results action and retain detailed summaries as hidden QA evidence. This closes prediction, consequence, diagnosis, study, and replay into one consumer-facing loop.
