# AGENTS.md

## Project

Tokenizer Training is a browser-first mobile arcade game about tokenization. The player predicts token boundaries by swiping across text. The game teaches tokenization through speed, surprise, Token Credit pressure, and technical feedback.

## Current Goal

Build a polished vertical slice from the existing single-file MVP. Preserve the core loop:
1. text appears
2. player swipes/cuts predicted token boundaries
3. actual tokenization resolves
4. technical/economic/snark feedback appears
5. Training accelerates until the player's Token Credits are depleted

## Stack

Use Vite + TypeScript + Phaser for the main game.
Prefer browser-first implementation.
Keep mobile readiness in mind.
Use pointer input that works for mouse and touch.
Capacitor may be added later, but do not prioritize native wrappers before the web game is solid.

## Browser/Mobile Interface Work

For mobile UI, layout, shell, safe-area, or touch-input work, cross-reference the browser game before judging the mobile surface. Start with `npm run mobile:crossref:status`; it verifies that current browser/mobile evidence exists, satisfies the contract, and is fresh enough for Codex to use autonomously.

Use `docs/current_surface_contract.md` as the visible browser contract and `docs/mobile_shell.md` for browser/mobile QA routes. The browser surface remains the mechanics and content source; `surface=mobile` may adapt layout, safe areas, and touch reach, but must not fork tokenizer fixtures, scoring, swipe/cut detection, progression, session/results flow, tutorial/endless structure, or persistence.

After mobile-facing changes, refresh browser/mobile evidence when needed, then run `npm run mobile:local`. When narrowing failures, run `npm run mobile:crossref` and `npm run mobile:freshness` directly. If the managed Codex shell cannot launch Playwright Chromium through `npm run mobile:capture`, use the Codex in-app browser against the QA routes in `docs/mobile_shell.md`, then rerun the validators.

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
- player starts Training with 40 Token Credits (`TC`)
- each exact resolved token earns 1 TC
- missed boundaries invalidate adjacent tokens and false cuts create additional rework
- difficulty weight and the progression penalty scale increase rework, not earnings
- session ends when Token Credits reach zero
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
