# AGENTS.md

## Project

Tokenization Training is a browser-first mobile arcade game about tokenization. The player predicts token boundaries by swiping across text. The game teaches tokenization through speed, surprise, cost, and technical feedback.

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
