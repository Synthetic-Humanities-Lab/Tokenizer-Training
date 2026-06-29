# Playtest Session Notes

This folder holds the first five field-note files for the user-base playtest.
They are prepared templates, not completed evidence.
`session-1.md` carries an explicit Session Requirement block because the first
remaining note is the required real phone/tablet touch session until
`npm run playtest:status` reports that the mobile gate is satisfied.
Its metadata scaffold intentionally removes desktop, same-machine, and
no-evidence options so the required physical-device note cannot be filled from
a localhost shakedown by accident.

Before a session:

```sh
npm run playtest:preflight
npm run playtest:doctor
npm run playtest:serve
```

`playtest:preflight` includes `npm run playtest:audit:local`, which checks the
local reading, principle, protocol, and browser-QA package without requiring
completed session notes. The full `npm run playtest:audit` should still fail
until the five notes and completed rollup pass.
Run `playtest:doctor` before starting the server so a stale Vite listener on
the strict playtest port is found before the tester arrives. If the default
port is occupied, the doctor probes candidate reset-safe launch URLs before
calling it stale. If it proves the current port is already serving the game
shell, keep that port unless the next note must satisfy the mobile gate and the
doctor reports failed Network-host launch checks on that port. In that
same-machine-only case, use the suggested free port consistently for serve,
brief, links, and session metadata. If the listener is wrong or dead, use the
suggested free port consistently for serve, brief, links, and session metadata.
The doctor prints the Recommended tester launch URL and copy-ready metadata
lines only when that launch can be used for the next note; same-machine launch
data is desktop shakedown only when the next note must satisfy the mobile gate.

Keep `docs/playtest_day_checklist.md` open while running sessions. It condenses
the command order, evidence requirements, Copy Summary closeout, and final
audit sequence without replacing the full protocol.

For a phone or tablet session on a trusted network, use:

```sh
npm run playtest:serve:lan
npm run playtest:brief
npm run playtest:launch-check
```

These serve commands pin strict port `5173`. If that port is occupied, stop
stale Vite servers only when the doctor or brief shows the listener is wrong
or dead. Otherwise keep the already-running game-shell port only when the
printed launch metadata is valid for the next note. If you use the
doctor-suggested port, run `npm run playtest:brief -- --port <chosen-port>`
instead.
If the brief says the selected launch URL is already serving the game shell,
keep that port only when the printed metadata is valid for the next note. If
the next note must satisfy the mobile gate and localhost passes while
Network-host launch checks fail, treat the requested port as same-machine-only
and use the suggested free port printed by the brief as planned launch setup,
not copy-ready metadata. If it falls back to
same-machine metadata, rerun with the exact Vite Network host before using a
phone/tablet note for the mobile gate. If the listener is the wrong app or does
not answer, use the suggested free port printed by the brief, then rerun
launch-check for the exact host before copying metadata.
After the server is running, run
`npm run playtest:launch-check -- --port <chosen-port>` with the same selected
port. Without an explicit `--host`, launch-check probes candidate launch URLs
and may select same-machine proof. This confirms a reset-safe launch URL serves
the game shell from the operator machine before the tester arrives; for a
phone/tablet note, rerun launch-check with the exact Vite Network host.
If the explicit LAN check fails, launch-check also runs a same-machine same-port
diagnosis. A local pass with a LAN failure means the game shell is up but
the network path is blocked; check the trusted network, the exact Vite Network
URL host, and macOS firewall or VPN isolation before retrying.
Use the Recommended tester launch URL printed by `playtest:brief`, then paste
the printed `Network` and `Launch URL` lines into the Session Metadata block
only when the command presents them as copy-ready metadata. If it prints `Do not
copy same-machine metadata into the required mobile note`, do not paste the
localhost/same-machine URL into that note; start LAN serving, rerun the brief
with the exact Vite Network host, and copy the `Network: LAN` metadata printed
after the phone/tablet loads. If `playtest:launch-check` prints `Do not copy
launch metadata from this failed check`, fix the server, host, or port and
rerun the check; the failed LAN-looking URL is not valid session metadata.
If the brief marks the next session note as the required real phone/tablet
touch session, use that physical-device run for the named note file.
For that note to satisfy the mobile gate, the metadata must say `Network: LAN`
and the `Launch URL` must use the Vite Network host, not `localhost` or
`127.0.0.1`.
Before the tester arrives, open the Recommended tester launch URL on the actual
device and stop at the menu. If it does not load, rerun
`npm run playtest:brief -- --host <network-host> --port <chosen-port>` and
`npm run playtest:launch-check -- --host <network-host> --port <chosen-port>`
using the exact host from Vite's Network URL.
Run `npm run playtest:links` only when you need the full reset-safe deep-link
list for QA routes. Treat its launch metadata as planned setup only; copy
session metadata only after `playtest:brief` or `playtest:launch-check`
presents it as copy-ready for the exact running host.
Run `npm run playtest:qa-links` only for internal browser/canvas QA before a
session. Its `qaViewport` and `qaFreezeElapsedMs` URLs are not tester launch
URLs and do not count as real mobile evidence.

After each tester reaches results, paste the Copy Summary into that tester's
note file. If the button changes to Save Summary, paste the downloaded summary
text file instead. Confirm it includes `Input evidence:`, then copy its `Run ID`
into the Session Metadata block. For mobile
sessions, record `Visual evidence` as `screenshot`, `photo`, `screen recording`,
or `observer notes`, and make the mobile-readability pass row name the concrete
surface or failure mode observed.
Also fill every Observation Notes row and the Principle Evidence Notes section.
The evaluator rejects blank or bare observation evidence and blank, bare, or
generic principle evidence. It also rejects contradictions between matching
observation rows and pass-criteria rows. The final rollup uses those notes to
decide whether the five design-principle areas are embodied, not merely whether
threshold rows passed.
Run `npm run playtest:status` after each session to see which note files are
still missing metadata, Copy Summary text, observation rows, debrief answers,
pass-criteria rows, or principle evidence before running the stricter evaluator.
The status report also keeps rollup readiness blocked until at least one
completed note is a real phone/tablet session with touch, pen, or mixed input,
`Network: LAN`, and a non-localhost `Launch URL`. A phone-like note with
incomplete required sections appears only as mobile metadata; it does not count
as completed mobile evidence. Observation/pass-criteria contradictions are
reported as incomplete pass-criteria evidence instead of rollup-ready notes. The
status report prints immediate next commands
for the current state, including the physical-device command sequence while the
mobile gate is still unsatisfied. That sequence starts with the doctor check,
starts the LAN server on the selected port, then reruns the brief and
launch-check with the exact Vite Network host before the note can count as
mobile evidence. If the selected port is not `5173`, append
`-- --port <chosen-port>` to the LAN serve command as well as the brief and
launch-check commands. Once the notes are rollup-ready, status prints the
evaluator/rollup/audit sequence instead.

To create the completed-rollup file without overwriting one that already exists,
run:

```sh
npm run playtest:rollup
```

After all five sessions:

```sh
npm run playtest:evaluate -- docs/playtests/session-1.md docs/playtests/session-2.md docs/playtests/session-3.md docs/playtests/session-4.md docs/playtests/session-5.md
```

After completing the rollup artifact:

```sh
npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md
```

After the session evaluator and rollup evaluator pass, run:

```sh
npm run playtest:audit
```

The audit checks the local reading notes, concept notes, principles, browser QA
evidence, protocol files, five completed session notes, real-device mobile
gate, and completed rollup together. Browser QA PNGs must be structurally
complete files, not only large enough on disk. It should fail while these files
are blank or while `docs/playtest_rollup_completed.md` is missing.

The evaluator should fail while these files are blank. A passing result is
supporting evidence only after the notes contain real metadata, tester behavior,
filled observation rows, criterion-specific pass evidence, debrief answers,
copied summaries, principle evidence, and any real contradictions recorded
without conflicts between matching observation and pass-criteria rows. The final
design gate also needs engagement and degraded-visual-intent evidence plus the
principle-embodiment audit in
`docs/playtest_rollup_template.md`; the rollup evaluator should fail while that
audit is blank.
