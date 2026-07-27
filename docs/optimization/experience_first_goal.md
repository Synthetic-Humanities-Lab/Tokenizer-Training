# Tokenizer Training Experience-First Goal

Orchestrate a whole-game transformation of Tokenizer Training. Produce a more entertaining, legible, tactile, and tacitly educational game, not another infrastructure audit. The user's examples are non-exhaustive: discover further improvements through research, code inspection, and play.

Read `AGENTS.md`, current source/tests, `docs/current_surface_contract.md`, `docs/game_design_principles.md`, Swink/Zubek notes and Google Drive sources, and historical optimization logs. Treat old logs as evidence, not a mandate to continue validation-first work. Maintain after every pass:
- `docs/optimization/experience_brief.md`: diagnosis, priorities, decisions, risks, next pass.
- `docs/optimization/experience_research_log.md`: source-to-design decisions; research is backdrop, not the product.
- `docs/optimization/experience_iteration_log.md`: before/after evidence and keep/revise/revert decisions.

Product truths:
- Tokenization must remain accurate to the named encoding. Never invent boundaries or token IDs.
- Preserve WienerWorks: a Claude-like obsolete AI-work interface where a human worker takes over tokenization. Wiener is a snarky, useful hotdog narrator with Stanley Parable-like pressure, not a generic mascot.
- Education is tacit and embodied. Tutorial may be explicit, but play teaches through prediction, consequence, review evidence, and Token Log recovery.
- Aim for Fruit Ninja's physical satisfaction applied to tokenization.
- An older version is preserved on GitHub. You may change pacing, timers, scoring/economics, progression, tutorial, layout, dialogue, animation, audio, feedback, modes, and interaction when evidence supports it.

Use explicit model routing rather than automatic inheritance:
- Parent/orchestrator: GPT-5.6 Sol, High.
- GPT-5.6 Terra, High: game/UX synthesis and substantial implementation.
- GPT-5.6 Luna, Medium: bounded audits, extraction, tests, builds, manifests, and captures.
- Sol Ultra only for an unusually difficult synthesis or final adversarial review; record why first. Never use Ultra routinely.
Give agents narrow, non-overlapping assignments. The orchestrator owns priorities, integration, visual judgment, and acceptance.

Run integrated whole-game passes:
1. Capture a truthful browser and iOS baseline. Diagnose home, role framing, onboarding, tutorial, slicing feel, feedback, clutter, pacing, audio, difficulty, progression, failure, results, replay, Token Log, and settings.
2. Research only questions that can change design. Translate Swink, Zubek, learning science, comparable games, and project history into ranked hypotheses.
3. Implement one coherent candidate. Every pass must create visible, audible, or interactive change. Infrastructure is allowed only when it directly blocks that candidate.
4. Compare before/after at small, standard, and large phone portrait plus desktop. Judge comprehension, role clarity, input trust, response, hierarchy, emotional rhythm, sound, delight, and replay desire. Correct regressions.
5. Log decisions, then run another whole-game pass responding to observed weaknesses. Complete at least three integrated passes; do not merely accumulate features.

During iteration run focused tests and only the build needed to play. Do not regenerate sixteen simulator routes or run the full suite after every small edit. At each integrated milestone run `npm run generate:fixtures`, `npm run test`, `npm run build`, `npm run build:ios-web`, relevant browser QA, and a current simulator playthrough.

Do not stop because documentation is complete or tests are green. Stop for review only after at least three materially distinct whole-game passes, with a playable browser/simulator candidate, concise before/after evidence, honest risks, and no unexplained failures. Ask first only for publishing, paid/external assets, external participants, destructive repository operations, or factual tokenization compromise.
