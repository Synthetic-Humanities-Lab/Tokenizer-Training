# Playtest Operations

This is the operational runbook for local QA, LAN launch setup, real-device
mobile checks, and five-session playtest evidence. Keep the README short; use
this file when preparing or running a session.

## Preflight

Before a user session, run:

```sh
npm run playtest:preflight
```

This regenerates tokenizer fixtures, runs the test suite, builds the project,
and runs the local evidence audit for reading notes, principles, protocol
files, and browser QA PNGs.

For ordinary development, `npm run dev` and `npm run dev:lan` still start Vite
with default port behavior. For user sessions, prefer the strict playtest serve
commands so launch metadata does not drift to an unnoticed fallback port:

```sh
npm run playtest:serve
npm run playtest:serve:lan
```

These commands pin port `5173` and fail fast if it is already occupied.

## Port Hygiene

Before starting the playtest server, inspect any occupied listener with the
doctor:

```sh
npm run playtest:doctor
```

If the port is already occupied, the doctor probes candidate reset-safe launch
URLs before calling it stale. If it proves the current port is already serving
the game shell, keep that port unless the next note must satisfy the mobile
gate and the doctor reports failed Network-host launch checks. In that
same-machine-only case, use the suggested free port for the phone/tablet
session.

If the listener is wrong or dead, inspect the printed `Port hygiene` commands,
stop only a confirmed stale Vite process, or use the suggested free port. Pass
the selected port to `playtest:serve`, `playtest:brief`, and `playtest:links`.

## Links And Briefs

To print reset-safe QA links and planned localhost/LAN launch targets, run:

```sh
npm run playtest:links
```

Treat its launch metadata as planned setup only. Copy session metadata only
after `playtest:brief` or `playtest:launch-check` presents it as copy-ready for
the exact running host.

To print a compact operator brief with the recommended launch URL, session
metadata lines marked copy-ready when valid, current note status, next session
note target, mobile-session requirement, and evaluator sequence, run:

```sh
npm run playtest:brief
```

The brief also checks the requested strict port. If localhost passes and
Network-host checks fail, the brief treats the requested port as
same-machine-only, selects the suggested free port, and uses that port for the
LAN serve command and planned Recommended tester launch URL. It does not print
copy-ready session metadata for that suggested port until launch-check passes
on the exact host.

If you deliberately choose another port such as `5174`, pass that port
explicitly:

```sh
npm run playtest:links -- --port 5174
npm run playtest:qa-links -- --port 5174
npm run playtest:brief -- --port 5174
npm run playtest:launch-check -- --port 5174
```

## Launch Check

After starting the strict playtest server, run `npm run playtest:launch-check`
with the same port printed by the brief. It verifies that the reset-safe launch
URL is serving the game shell before a tester arrives.

Without an explicit `--host`, launch-check probes candidate launch URLs and may
select same-machine proof. This check is local to the operator machine; the
required phone/tablet session still needs:

```sh
npm run playtest:launch-check -- --host <network-host> --port <chosen-port>
```

If that explicit LAN check fails, launch-check runs a same-machine same-port
diagnosis too. A local pass with a LAN failure means the shell is running but
the network path is blocked; check that the device is on the same trusted
network, that the host exactly matches Vite's Network URL, and that macOS
firewall or VPN isolation is not blocking Vite before copying metadata.

## Deep Links

- `?mode=tutorial` starts directly in Tutorial.
- `?mode=endless` starts directly in Training.
- `?mode=tutorial-complete` starts directly at the tutorial handoff screen for QA.
- `?mode=results` starts directly at a zero-round results screen for QA.
- `?mode=protocol-results` starts directly at a representative post-handoff
  results screen whose Copy Summary payload satisfies the playtest evaluator's
  run/start/input/round-trace/cut-count evidence shape.
- `?playtestReset=1` clears saved high score and mute state for a controlled
  tester start.
- No mode starts at the Main Menu.

Use `npm run playtest:qa-links` only for internal browser/canvas QA before a
session. Its `qaViewport` and `qaFreezeElapsedMs` URLs are not tester launch
URLs and do not count as real mobile evidence.

## Session Notes

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
input, `Network: LAN`, and a non-localhost `Launch URL`.

## Real Phone Or Tablet Sessions

For phone/tablet sessions, run `npm run playtest:serve:lan`, then run
`npm run playtest:brief`. If you deliberately chose a different port, run
`npm run playtest:brief -- --port <chosen-port>` instead.

Use the printed Recommended tester launch URL and copy its `Network` and
`Launch URL` lines into the session metadata only when the command presents
them as copy-ready metadata. If it prints `Do not copy same-machine metadata
into the required mobile note`, do not paste the localhost/same-machine URL
into that note.

For a mobile note to count, `Network` must be `LAN` and the `Launch URL` must
use Vite's Network host, not `localhost` or `127.0.0.1`. Before the tester
arrives, open that Recommended tester launch URL on the actual phone/tablet and
stop at the menu. If it does not load, use the exact host from Vite's Network
URL:

```sh
npm run playtest:brief -- --host <network-host> --port <chosen-port>
npm run playtest:launch-check -- --host <network-host> --port <chosen-port>
```

For a mobile readability pass, the note must name a concrete screenshot, photo,
screen recording, or observer-note artifact plus the readable surface or
failure mode being checked. Browser emulation, desktop touchscreens, and
trackpads do not prove real phone/tablet readability.

## Rollup And Audit

Use `docs/playtest_rollup_template.md` after five sessions to decide whether
the pass criteria and principle-embodiment evidence are actually met.

To check the five note files mechanically, run:

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

Run `npm run playtest:audit:local` when you need only the pre-session local
package check; it must pass before user sessions, while the full audit must
remain non-zero until completed session notes and rollup evidence exist.

The evaluator exits non-zero when session metadata is blank or still contains
template placeholders, copied-summary evidence is incomplete, the copied-summary
provenance does not match the session, or the mobile gate has no real
phone/tablet session with touch, pen, or mixed input, `Network: LAN`, and a
non-localhost `Launch URL`.

Session metadata and copied summaries must keep the game-generated `tt-...`
run ID format; participant IDs or spreadsheet labels are not accepted as run
IDs. The copied `Input evidence:` line records the browser-reported pointer
type during play; it supports the note but does not replace the required
real-device metadata and visual evidence for the mobile gate.
