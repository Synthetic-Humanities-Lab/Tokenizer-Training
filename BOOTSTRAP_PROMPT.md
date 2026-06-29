# One-Paste Bootstrap Prompt for Codex

You are working on Manual Tokenization Training.

I have provided a reference MVP HTML file. Your first job is to create the repo context and production workflow files from the material below, then proceed with Phase 1 setup.

Create these files:

- AGENTS.md
- docs/product_brief.md
- docs/design_spec.md
- docs/style_guide.md
- docs/tokenizer_spec.md
- docs/content_matrix.md
- docs/repo_target.md
- data/seed_strings.csv
- prompts/phase1_setup_prompt.txt
- prompts/phase2_vertical_slice_prompt.txt

After creating the files, read AGENTS.md and prompts/phase1_setup_prompt.txt and execute Phase 1.

Important: preserve the existing MVP as a reference, not the final architecture.

If you need to make reasonable assumptions, make them and document them. Do not stall.

---

## AGENTS.md

# AGENTS.md

## Project

Manual Tokenization Training is a browser-first mobile arcade game about tokenization. The player predicts token boundaries by swiping across text. The game teaches tokenization through speed, surprise, cost, and technical feedback.

## Current Goal

Build a polished vertical slice from the existing single-file MVP. Preserve the core loop:
1. text appears
2. player swipes/cuts predicted token boundaries
3. actual tokenization resolves
4. technical/economic/snark feedback appears
5. endless progression continues until balance reaches zero

## Stack

Use Vite + TypeScript + Phaser for the main game.
Prefer browser-first implementation.
Keep mobile readiness in mind.
Use pointer input that works for mouse and touch.
Capacitor may be added later, but do not prioritize native wrappers before the web game is solid.

## Tokenization

Do not use the old approximate tokenizer as final logic.
Use real tokenizer fixtures generated from a real tokenizer.

Preferred approach:
- build-time fixture generation
- checked-in JSON fixtures
- deterministic tests verifying token spans, reconstruction, and scoring

Be careful with byte spans, Unicode, emojis, and grapheme boundaries.
For the first pass, it is acceptable to restrict generated playable examples to cleanly displayable boundary positions.

## Aesthetic

The game should look like worn enterprise software from an exhausted future:
- haggard 2000s computing
- beige/grey/green industrial palette
- bureaucratic UI
- not glossy sci-fi
- not neon cyberpunk
- not startup SaaS

## Tone

The AI overseer is dry, snarky, and technically useful.
Feedback must be short.
Educational diagnosis comes first, joke second.

Good examples:
- Leading-space boundary missed.
- Over-segmentation increased token load.
- Meaning preserved. Margins damaged.
- You are not yet cleared for URLs.

Bad examples:
- long speeches during gameplay
- generic motivational praise
- fake semantic hallucinations unrelated to tokenization

## Gameplay

Tutorial:
- slow, guided, readable
- explains tokenization and player task
- introduces simple words, punctuation, then dense strings

Main mode:
- endless progression
- difficulty increases through speed and tokenization complexity
- player balance starts positive
- correct cuts earn pay
- missed/false cuts increase company cost
- session ends when balance reaches zero
- high score saved locally

## Testing

Add or update tests for:
- fixture generation
- tokenizer reconstruction
- scoring
- difficulty progression
- swipe/cut boundary detection
- save/load high score

Run tests and build before reporting completion.

## Working Style

Before major changes, inspect the repo and summarize the plan.
Keep systems modular.
Avoid overengineering.
Do not remove the core loop.
Do not add unrelated LLM pipeline mechanics.
Report what changed, how to run it, and what remains risky.


---

## docs/product_brief.md

# Manual Tokenization Training

Manual Tokenization Training is a browser-first mobile arcade game about tokenization.

The player is a human trainee in a worn, future corporate AI system. AI inference has become expensive, so the system trains humans to manually predict token boundaries. Each round presents a text string. The player swipes across the string to cut predicted token boundaries. The system reveals the true tokenizer segmentation, scores accuracy, applies wage/cost consequences, and advances.

## Tone

Exhausted enterprise software. 2000s corporate computing. Bureaucratic decay. Dry AI overseer. Funny, but technically educational.

## Core Loop

1. Text appears.
2. Player swipes/cuts predicted token boundaries.
3. True tokenization resolves.
4. Correct cuts, missed cuts, false cuts, token count, and cost are shown.
5. Session continues until balance reaches zero.

## Primary Learning

- Words are not always tokens.
- Spaces matter.
- Punctuation and formatting matter.
- Weird strings can become expensive.
- Tokenization is a computational transformation, not normal reading.


---

## docs/design_spec.md

# Manual Tokenization Training: Design Spec

## Overview

Genre: Educational arcade microgame  
Target: Browser-first mobile game  
Primary reference: Fruit Ninja meets WarioWare, filtered through exhausted corporate training software.

The player slices text where token boundaries will occur. The system reveals real tokenization, scores the player, applies wage/cost consequences, and moves immediately to the next round.

## Game States

1. Boot
2. Main Menu
3. Tutorial
4. Endless Training
5. Results / Termination

## Tutorial

The tutorial should be slow, guided, and explicit. It should teach:

1. Words and spaces can create boundaries.
2. Punctuation and contractions complicate boundaries.
3. Dense strings like URLs, emails, code, and filenames can fragment.
4. Incorrect segmentation has cost consequences.

Tutorial feedback should pause long enough to read.

## Endless Training

Endless Training is the core mode.

- Session starts with positive balance.
- Correct cuts earn pay.
- Missed boundaries and false cuts incur company cost.
- Net balance updates after each round.
- Session ends when balance reaches zero.
- High score and best rank are stored locally.

## Difficulty

Difficulty increases through:

- reduced time window
- higher tier text categories
- denser boundary patterns
- larger economic penalties
- increasingly strange strings

Difficulty should come from tokenization complexity, not arbitrary enemies or unrelated mechanics.

## Input

Use pointer input that works for mouse and touch.

The player should swipe through the text. The game should register cuts at valid boundary slots between grapheme clusters, snapping to the nearest cut position when reasonable.

## Feedback

Each round should show:

- correct cuts
- missed boundaries
- false cuts
- final token count
- pay
- company cost
- net balance change
- one short overseer line

Feedback should be fast but readable.

## Economy

Suggested values can be tuned:

- base pay scales with tier
- correct cuts improve pay
- missed boundaries cost more than false cuts
- dense/high-token strings can increase cost
- balance reaching zero ends the session

## Rank System

Use comic pseudo-benchmarking based on score, accuracy, speed, and cost efficiency.

Possible ranks:
- Regex Intern
- Junior Boundary Clerk
- Prompt Intake Associate
- BPE Adjacent
- cl100k Probationary
- Economically Defensible Mammal
- Temporary Sequence Specialist

## Non-Goals for This Phase

Do not build:
- multiple game modes
- native mobile app wrapper
- voice acting
- leaderboard backend
- user-generated prompts
- alternate tokenizer comparison mode
- fake generated answer stage

Focus on the polished vertical slice.


---

## docs/style_guide.md

# Style Guide

## Visual Tone

The game should look like worn enterprise software from an exhausted future.

Use:
- haggard 2000s computing
- beige, grey, green, weak amber
- industrial control-panel feeling
- degraded corporate training UI
- bureaucratic typography
- subtle grime, scuffs, age, and fatigue
- flat panels, bevels, bad payroll-system energy

Avoid:
- neon cyberpunk
- glossy sci-fi
- cute mascots
- bright startup SaaS aesthetics
- heroic sword/fantasy visuals

## Motion

- Swipe should feel responsive and tactile.
- Correct cuts should snap or flash.
- Missed cuts should appear clearly.
- False cuts should feel costly but not confusing.
- Feedback should linger long enough to read.

## Sound Direction

Flat, tired, office-machine sound:
- dull key clicks
- muted error beeps
- old printer tick
- payroll register chirp
- fluorescent hum
- soft slicing gesture, not heroic sword slash

## Overseer Voice

The AI overseer should be:
- dry
- technical
- bureaucratic
- faintly irritated
- short
- educational first, funny second

Examples:
- Leading-space boundary missed.
- Punctuation cluster mishandled.
- Meaning preserved. Margins damaged.
- You are not yet cleared for URLs.
- This error has been monetized.
- Adequate for a biological tokenizer.

Avoid:
- long monologues during active play
- generic encouragement
- fake semantic hallucinations
- sitcom punchlines


---

## docs/tokenizer_spec.md

# Tokenizer Spec

Use real tokenizer data, not the MVP approximation.

## Recommended Implementation

Use a build-time tokenizer fixture generator.

Pipeline:
1. Read data/seed_strings.csv.
2. Tokenize each string using a real tokenizer.
3. Generate src/game/data/fixtures.json.
4. Runtime game reads precomputed fixtures.

## Preferred Tokenizers

Start with one tokenizer only. Good first candidates:
- cl100k_base
- o200k_base

Do not mix tokenizers inside a run unless a later mode explicitly teaches tokenizer differences.

## Fixture Fields

Each fixture should include:

- id
- text
- category
- tier
- token_count
- token_ids
- token_strings
- boundary_positions
- difficulty_weight
- notes

## Unicode Warning

Real tokenizers may operate over byte sequences or token strings that do not trivially map to JavaScript character indices. Emoji, combined glyphs, accents, and mixed scripts need care.

For the first polished version, either:
1. restrict the playable corpus to strings whose token boundaries map cleanly to visible grapheme boundaries, or
2. implement byte-span to grapheme-span mapping carefully.

Add tests that verify:
- token strings reconstruct the original input
- boundary positions are sorted
- boundary positions are within valid display ranges
- each fixture has at least one playable boundary unless intentionally marked otherwise


---

## docs/content_matrix.md

# Content Matrix

Difficulty increases through tokenization complexity.

## Tier 1: Simple Prose

- short common words
- ordinary spacing
- minimal punctuation

Examples:
- the cat sat on the mat
- how many dogs are there
- a small prompt arrives

## Tier 2: Common Irregularities

- contractions
- apostrophes
- hyphenation
- numbers
- punctuation

Examples:
- I can't believe it.
- re-enter the room
- it costs $19.99
- wait... what?

## Tier 3: Dense Strings

- URLs
- emails
- filenames
- hashtags
- camelCase
- snake_case

Examples:
- openai.com/pricing
- admin@example.com
- hello_world_v2.py
- parseJSONQuickly()
- #GameDev2026

## Tier 4: Chaotic Strings

- emoji
- multilingual strings
- symbol clusters
- code snippets
- weird proper nouns
- internet slang

Examples:
- mañana 😂
- X Æ A-12
- cost_per_token++
- model_name=cl100k_base
- lol!!! why tho

## Selection Rules

- Avoid immediate repeats.
- Rotate categories.
- Increase tier availability over time.
- Harder examples should offer higher pay but higher risk.


---

## docs/repo_target.md

# Target Repository Shape

manual-tokenization-training/
  AGENTS.md
  README.md
  package.json
  index.html
  src/
    main.ts
    game/
      Game.ts
      scenes/
        BootScene.ts
        MenuScene.ts
        TutorialScene.ts
        PlayScene.ts
        ResultsScene.ts
      systems/
        TokenizerSystem.ts
        ScoringSystem.ts
        DifficultySystem.ts
        SwipeCutSystem.ts
        FeedbackSystem.ts
        AudioSystem.ts
        StorageSystem.ts
      ui/
        Hud.ts
        OverseerPanel.ts
        FeedbackCard.ts
      data/
        fixtures.json
        overseer_lines.json
    styles/
  scripts/
    generate-token-fixtures.ts
  tests/
    tokenizer-fixtures.test.ts
    scoring.test.ts
    difficulty.test.ts
    swipe-cut.test.ts
  docs/
  data/
    seed_strings.csv
  reference/


---

## prompts/phase1_setup_prompt.txt

Read AGENTS.md, the docs folder, and reference/manual_tokenization_training_mvp.html.

Goal: set up the production workflow for Manual Tokenization Training without overbuilding the game yet.

Tasks:
1. Create a Vite + TypeScript + Phaser project structure.
2. Preserve the existing MVP as a reference file, not as the main architecture.
3. Implement basic game states:
   - BootScene
   - MenuScene
   - TutorialScene
   - PlayScene
   - ResultsScene
4. Add modular systems:
   - SwipeCutSystem
   - ScoringSystem
   - DifficultySystem
   - FeedbackSystem
   - StorageSystem
   - TokenizerSystem placeholder
5. Add a build-time tokenizer fixture pipeline:
   - data/seed_strings.csv
   - scripts/generate-token-fixtures.ts
   - src/game/data/fixtures.json
   - tests that verify fixture shape and reconstruction
6. For now, if real tokenizer integration is blocked, create the fixture pipeline interface and use deterministic hand-authored fixtures. Document the blocker clearly.
7. Add npm scripts:
   - dev
   - build
   - test
   - generate:fixtures
8. Add tests for:
   - scoring
   - difficulty progression
   - fixture validation
   - local high score storage
9. Use responsive browser layout suitable for desktop and mobile.
10. Run tests and build.

Important constraints:
- Do not add React unless there is a strong reason.
- Do not add native mobile packaging yet.
- Do not change the core loop.
- Do not turn the game into a generic AI simulator.
- Keep the worn 2000s enterprise aesthetic.
- Keep feedback short, technical, and dry.

Before coding, inspect the repo and summarize your plan. Then implement.

When finished, report:
- commands to run
- what changed
- tests/build result
- known limitations


---

## prompts/phase2_vertical_slice_prompt.txt

Read AGENTS.md and the current repo.

Goal: build a polished vertical slice of Manual Tokenization Training.

Definition of Done:
1. The game runs in browser with npm run dev.
2. The game builds successfully with npm run build.
3. The player can complete a slow guided tutorial.
4. The player can enter endless training mode.
5. The player swipes/cuts text to predict token boundaries.
6. Actual tokenization fixtures resolve each round.
7. The game shows:
   - correct cuts
   - missed boundaries
   - false cuts
   - token count
   - pay
   - company cost
   - net balance change
   - one short overseer line
8. Balance starts positive and session ends when it reaches zero.
9. Difficulty increases through:
   - reduced time window
   - higher-tier fixture categories
   - denser token boundary patterns
10. High score and best rank are saved locally.
11. UI is mobile-first and playable with mouse or touch.
12. Add placeholder sound effects with a mute toggle, or implement an AudioSystem stub if assets are missing.
13. Add a simple rank system based on score/accuracy/cost efficiency.
14. Add tests for scoring, difficulty, fixture selection, and tokenizer fixture validation.
15. Use the game design skill/plugin if available to audit the core loop, tutorial clarity, game feel, and difficulty ramp. If the skill/plugin is unavailable, note that and proceed with an internal design audit.

Game feel requirements:
- swipe must feel responsive
- cuts should leave a visible trail
- correct cuts should snap or flash
- missed boundaries should appear clearly
- false cuts should feel costly but not confusing
- feedback should linger long enough to read
- tutorial should be much slower than main mode

Aesthetic requirements:
- haggard future corporate training software
- worn 2000s computing
- grimy beige/grey/green palette
- bureaucratic typography
- no neon cyberpunk
- no glossy SaaS dashboard

Tone requirements:
- technical first, funny second
- short overseer lines only
- no long narration during active play
- no fake generated answers
- consequences should be about tokenization cost, overhead, and accuracy

When finished:
- run tests
- run build
- report what changed
- report known risks
- list next recommended tasks


---

Now begin Phase 1.
