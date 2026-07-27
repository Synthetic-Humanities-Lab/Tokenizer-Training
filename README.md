# Tokenizer Training

Browser-first Phaser prototype for training players to predict tokenizer
boundaries by swiping across text. The game uses checked-in `cl100k_base`
fixtures, resolves the player's cuts against tokenizer truth, and wraps the
result in WienerWorks' hostile training-software fiction.

The original single-file MVP is preserved in
`reference/manual_tokenization_training_mvp.html`; the current runtime starts
from `src/main.ts`.

## Quick Start

```sh
npm install
npm run generate:fixtures
npm run dev
```

Open the printed local Vite URL. Use `npm run dev:lan` only when another device
on the same trusted network needs to load the web build.

## Core Commands

```sh
npm run generate:fixtures
npm run test
npm run build
npm run build:pages
```

- `generate:fixtures` rebuilds fixtures from `src/game/data/seed_strings.csv`.
- `test` runs the Vitest suite.
- `build` runs TypeScript checking and the Vite production build.
- `build:pages` produces the repository-relative GitHub Pages build.
Pushes to `main` run `.github/workflows/deploy-pages.yml`, which tests, builds,
and deploys `dist/`.
For formal playtest setup, use the stricter playtest commands rather than the
ordinary dev server:

```sh
npm run playtest:preflight
npm run playtest:serve
npm run playtest:serve:lan
npm run playtest:brief
npm run playtest:doctor
npm run playtest:status
npm run playtest:audit:local
npm run playtest:audit
```

See `docs/playtest_operations.md` for the full port, LAN, QA-link, note, rollup,
and mobile-gate procedure.

## Current Scope

The project is a playable vertical slice: Vite + TypeScript + Phaser, scene
boundaries, modular game systems, deterministic tokenizer fixtures, tutorial
mode, Training progression with no round cap while Token Credits remain,
exact-token/rework economics, rank/high-score persistence, resettable playtest starts,
browser QA geometry, and tests.

It is still pre-user-playtest. Real-device touch behavior, mobile readability,
player comprehension, and economic tuning need external evidence before the
design should be treated as validated.

## Documentation Map

- `AGENTS.md`: project constraints and working style.
- `docs/playtest_operations.md`: operational runbook for local, LAN, and mobile
  playtest setup.
- `docs/user_playtest_protocol.md`: tester-session protocol.
- `docs/playtest_facilitator_card.md`: no-coaching table-side script.
- `docs/playtest_day_checklist.md`: short operator checklist.
- `docs/playtests/README.md`: prepared note files and evidence rules.
- `docs/playtest_rollup_template.md`: five-session rollup template.
- `docs/game_design_principles.md`: design principles used for evaluation.
- `docs/design_verification_matrix.md`: current evidence and known gaps.

## Tokenizer Notes

Fixtures are generated with `js-tiktoken` and `cl100k_base`. The generator
records token IDs, token strings, byte spans, grapheme spans, tokenizer byte
boundaries, and tokenizer metadata.

Candidate strings whose tokenizer byte boundaries cannot map cleanly to
playable grapheme boundaries are rejected for now. That keeps the display honest
while unsafe Unicode and boundary cases remain outside the first playtestable
slice.
