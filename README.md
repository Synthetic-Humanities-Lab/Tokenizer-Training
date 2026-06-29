# Tokenizer Training

Browser-first Phaser prototype for training players to predict token boundaries by swiping across text. The original single-file MVP is preserved in `reference/manual_tokenization_training_mvp.html`; the production workflow starts from `src/main.ts`.

## Commands

```sh
npm install
npm run generate:fixtures
npm run dev
npm run dev:lan
npm run playtest:preflight
npm run playtest:serve
npm run playtest:serve:lan
npm run playtest:links
npm run playtest:qa-links
npm run playtest:brief
npm run playtest:doctor
npm run playtest:notes
npm run playtest:status
npm run playtest:rollup
npm run playtest:evaluate
npm run playtest:evaluate-rollup
npm run playtest:audit:local
npm run playtest:audit
npm run test
npm run build
```

## Playtest Links

Before a user session, run:

```sh
npm run playtest:preflight
```

This regenerates tokenizer fixtures, runs the test suite, builds the project,
and runs the local evidence audit for reading notes, principles, protocol
files, and browser QA PNGs. For ordinary development, `npm run dev` and
`npm run dev:lan` still start Vite with its default port behavior. For user sessions, prefer the strict playtest serve
commands so launch metadata does not drift to an unnoticed fallback port:

```sh
npm run playtest:serve
npm run playtest:serve:lan
```

These commands pin port `5173` and fail fast if it is already occupied. Before
starting the playtest server, inspect any occupied listener with the doctor,
stop only a confirmed stale Vite process, or deliberately choose another port
and pass that same port to the link/brief commands:

```sh
npm run playtest:doctor
```

If the port is already occupied, the doctor probes candidate reset-safe launch
URLs before calling it stale. If it proves the current port is already serving
the game shell, keep that port unless the next note must satisfy the mobile
gate and the doctor reports failed Network-host launch checks. In that
same-machine-only case, use the suggested free port for the phone/tablet
session. If the listener is wrong or dead, inspect the printed `Port hygiene`
commands, stop only a confirmed stale Vite process, or use the suggested free
port. Pass the selected port to `playtest:serve`, `playtest:brief`, and
`playtest:links`. The doctor also prints the Recommended tester launch URL plus
copy-ready `Network` and `Launch URL` metadata lines only when that launch can
be used for the next note. Same-machine launch data is desktop shakedown only
when the next note must satisfy the mobile gate. To print reset-safe QA links
and planned localhost/LAN launch targets, run:

```sh
npm run playtest:links
```

To print a compact operator brief with the recommended launch URL, session
metadata lines marked copy-ready when valid, current note status, next session note target, mobile-session
requirement, and evaluator sequence, run:

```sh
npm run playtest:brief
```

The brief also checks the requested strict port. If the port is already
listening, it probes candidate reset-safe launch URLs. When one candidate is
already serving the Tokenizer Training shell, the brief keeps the
requested port only if that launch can be used for the next note. With the
default host list, localhost is checked first so stale LAN addresses do not
block desktop shakedown, but if the next note must satisfy the mobile gate the
brief also probes Network-host launch URLs on the requested port. If localhost
passes and those Network-host checks fail, the brief treats the requested port
as same-machine-only, selects the suggested free port, and uses that port for
the LAN serve command and planned Recommended tester launch URL. It does not
print copy-ready session metadata for that suggested port until launch-check
passes on the exact host. If the listener is the wrong app or does not answer,
the brief prints the bind and launch failures and uses the suggested free port
consistently.

If you deliberately choose another port such as `5174`, pass that port
explicitly:

```sh
npm run playtest:links -- --port 5174
npm run playtest:qa-links -- --port 5174
npm run playtest:brief -- --port 5174
npm run playtest:launch-check -- --port 5174
```

After starting the strict playtest server, run `npm run playtest:launch-check`
with the same port printed by the brief. It verifies that the reset-safe launch
URL is serving the game shell before a tester arrives. Without an explicit
`--host`, it probes candidate launch URLs and may select same-machine proof so
stale LAN addresses do not create a false setup failure. This check is local to
the operator machine; the required phone/tablet session still needs
`npm run playtest:launch-check -- --host <network-host> --port <chosen-port>`
and the actual device must open the same URL and stop at the menu.
If that explicit LAN check fails, launch-check runs a same-machine same-port
diagnosis too. A local pass with a LAN failure means the shell is running
but the network path is blocked; check that the device is on the same trusted
network, that the host exactly matches Vite's Network URL, and that macOS
firewall or VPN isolation is not blocking Vite before copying metadata.

- `?mode=tutorial` starts directly in Tutorial.
- `?mode=endless` starts directly in Endless Training.
- `?mode=tutorial-complete` starts directly at the tutorial handoff screen for QA.
- `?mode=results` starts directly at a zero-round results screen for QA.
- `?mode=protocol-results` starts directly at a representative post-handoff
  results screen whose Copy Summary payload satisfies the playtest evaluator's
  run/start/input/round-trace/cut-count evidence shape.
- `?playtestReset=1` clears saved high score and mute state for a controlled tester start.
- No mode starts at the Main Menu.

The current playtest protocol is in `docs/user_playtest_protocol.md`.
Use `docs/playtest_facilitator_card.md` as the table-side no-coaching script.
Use `docs/playtest_day_checklist.md` as the short operator checklist while
running the five sessions.
Use `npm run playtest:qa-links` only for internal browser/canvas QA before a
session; its `qaViewport` and `qaFreezeElapsedMs` URLs are not tester launch
URLs and do not count as real mobile evidence.
Use `npm run playtest:links` only when you need the full reset-safe deep-link
list. Treat its launch metadata as planned setup only; copy session metadata
only after `playtest:brief` or `playtest:launch-check` presents it as
copy-ready for the exact running host.
Use `docs/playtest_session_notes_template.md` to record each tester session.
Observation rows and pass-criteria rows must not contradict each other; the
session evaluator rejects conflicts between matching rows.
To create the first five non-overwriting note files, run:

```sh
npm run playtest:notes
```

After each session, run:

```sh
npm run playtest:status
```

This gives a short per-note completion report before the stricter five-session
evaluator. Its rollup-ready line stays `no` until five notes are complete and
at least one note is a real phone/tablet session with touch, pen, or mixed
input, `Network: LAN`, and a non-localhost `Launch URL`. A phone-like note
with incomplete sections appears only as mobile metadata, not completed mobile
evidence. Observation/pass-criteria contradictions are reported as incomplete
pass-criteria evidence rather than rollup-ready notes. The report also prints
the immediate next commands for the current state, including the physical-device sequence while the mobile gate is
unsatisfied. That sequence starts with the doctor check, uses the LAN server on
the selected port, and reruns the brief and launch-check with the exact Vite
Network host. If the doctor selected a non-default port, append
`-- --port <chosen-port>` to the LAN serve command. Once the notes are ready
for rollup, status prints the evaluator/rollup/audit sequence.

For phone/tablet sessions, run `npm run playtest:serve:lan`, then run
`npm run playtest:brief`. If you deliberately chose a different port, run
`npm run playtest:brief -- --port <chosen-port>` instead. Use the printed
Recommended tester launch URL and copy its `Network` and `Launch URL` lines
into the session metadata only when the command presents them as copy-ready
metadata. If it prints `Do not copy same-machine metadata into the required
mobile note`, do not paste the localhost/same-machine URL into that note; start
LAN serving, rerun the brief with the exact Vite Network host, and copy the
`Network: LAN` metadata printed after the phone/tablet loads. If the brief says
the requested port is already
serving the game shell, keep that launch metadata and do not start a second
server. If that metadata is same-machine, it does not satisfy the phone/tablet
mobile gate; rerun the brief with the exact Vite Network host for a physical
device session. If the brief reports a blocked or wrong listener and switches
to a suggested free port, start the server with the port shown in the brief,
rerun launch-check for the exact host, and copy metadata only after the game
shell passes. If the brief says the next session note is
required to be the real phone/tablet touch session, run that session on the
physical device rather than filling another desktop note.
For that note to count as mobile evidence, `Network` must be `LAN` and the
`Launch URL` must use Vite's Network host, not `localhost` or `127.0.0.1`.
Before the tester arrives, open that Recommended tester launch URL on the actual
phone/tablet and stop at the menu. If it does not load, use the exact host from
Vite's Network URL:

```sh
npm run playtest:brief -- --host <network-host> --port <chosen-port>
npm run playtest:launch-check -- --host <network-host> --port <chosen-port>
```

Use `docs/playtest_rollup_template.md` after five sessions to decide whether the
pass criteria and principle-embodiment evidence are actually met. To check the
five note files mechanically, run:

```sh
npm run playtest:evaluate -- docs/playtests/session-1.md docs/playtests/session-2.md docs/playtests/session-3.md docs/playtests/session-4.md docs/playtests/session-5.md
```

To create the completed rollup artifact without overwriting an existing one,
run:

```sh
npm run playtest:rollup
```

After completing the rollup artifact, run:

```sh
npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md
```

After the session evaluator and rollup evaluator pass, run:

```sh
npm run playtest:audit
```

The audit checks the local reading notes, concept notes, principles, browser QA
evidence, protocol files, five completed session notes, real-device mobile
gate, completed rollup, and rollup/session consistency together. Browser QA
PNGs must be structurally complete files at the expected QA viewport dimensions,
not only large enough on disk. It exits non-zero until those evidence gates pass.
Run `npm run playtest:audit:local` when you need only the pre-session local
package check; it must pass before user sessions, while the full audit must
remain non-zero until completed session notes and rollup evidence exist.

The evaluator exits non-zero when a session is missing, session metadata is
blank or still contains template placeholders, a pass cell is blank or
ambiguous, a verdict lacks evidence text, debrief answers are blank or bare
verdicts, debrief answers do not address their specific question,
observation-note rows are blank or bare, principle evidence notes are blank or
generic, copied-summary evidence is incomplete, the copied-summary provenance
does not match the session, a pass row uses generic evidence instead of naming
the criterion-specific observed behavior, engagement/aesthetic evidence does
not name both continued play interest and intentional degraded visual style, or
the mobile gate has no real
phone/tablet session with touch, pen, or mixed input, `Network: LAN`, and a
non-localhost `Launch URL`.
Session metadata and copied summaries must keep the game-generated `tt-...`
run ID format; participant IDs or spreadsheet labels are not accepted as run
IDs.
The copied `Input evidence:` line records the browser-reported pointer type
during play; it supports the note but does not replace the required real-device
metadata and visual evidence for the mobile gate.
The rollup evaluator exits non-zero when session-index rows, threshold counts,
principle decisions, or the final broader-playtest-ready decision are still
blank, generic, contradictory, or unresolved.
The final audit also checks that the completed rollup's session index, copied
summary start sources, inputs, run IDs, and pass counts match the evaluated
session notes.
For a mobile readability pass, the note must name a concrete screenshot, photo,
screen recording, or observer-note artifact plus the readable surface or failure
mode being checked.
The prepared files in `docs/playtests/` are blank field-note templates; see
`docs/playtests/README.md` before treating them as evidence.

## Current Scope

The project is now a playable vertical slice: Vite + TypeScript + Phaser, scene boundaries, modular game systems, deterministic tokenizer fixtures, tutorial mode with an Endless Training handoff, endless training, economy, rank storage, resettable playtest starts, browser screenshot QA, and tests. The slice is still pre-user-playtest because real-device touch behavior, comprehension, and economic tuning need external evidence.

The production build splits the Phaser runtime into a named `phaser-engine`
chunk and uses an explicit Phaser-sized chunk warning limit. This keeps
preflight output focused on actionable regressions while leaving app code in a
separate chunk.

## Tokenizer Status

The runtime uses checked-in fixtures generated from `data/seed_strings.csv` with `js-tiktoken` and `cl100k_base`. The fixture generator records token IDs, token strings, token byte spans, graphemes, grapheme byte spans, grapheme boundary positions, tokenizer byte boundaries, and tokenizer metadata.

The generator intentionally rejects candidate strings whose tokenizer byte boundaries cannot map cleanly to playable grapheme boundaries. That restriction keeps the current display honest while Unicode and unsafe boundary cases remain out of scope for the first playtestable slice.

## Design Notes

The reading-derived design repository lives in:

- `docs/game_design_reading_notes/`
- `docs/game_design_concepts/`
- `docs/game_design_principles.md`
- `docs/design_verification_matrix.md`
