# User Playtest Protocol

This protocol is for the first user-base playtest of Manual Tokenization
Training. It is designed to test whether the game teaches tokenizer boundaries
through action, feedback, economy, and critical framing.

## Build And Launch

Run:

```sh
npm install
npm run playtest:preflight
```

The preflight command regenerates tokenizer fixtures, runs tests, builds the
project, and runs the local evidence audit for reading notes, principles,
protocol files, and browser QA PNGs. If it fails, fix the build or local
evidence package before putting the game in front of a tester. For user
sessions, launch with the strict playtest server so the
metadata port stays stable:

```sh
npm run playtest:doctor
```

Run the doctor before starting the server. If port `5173` is already occupied,
the doctor probes candidate reset-safe launch URLs before calling it stale. If
it proves the current port is already serving the game shell, keep that port
unless the next note must satisfy the mobile gate and the doctor reports that
Network-host launch checks failed on that port. In that same-machine-only case,
use the suggested free port for the phone/tablet session. If the listener is
wrong or dead, inspect the printed `Port hygiene` commands, stop only a
confirmed stale Vite process, or use the suggested free port. Pass the selected
port to serve, brief, and links. The doctor prints the Recommended tester launch
URL plus copy-ready `Network` and `Launch URL` session-metadata lines only when
the selected launch can be used for the next note; same-machine launch data is
desktop shakedown only when the next note must satisfy the mobile gate.
If it prints `Port hygiene`, inspect the requested listener with
`lsof -nP -iTCP:<chosen-port> -sTCP:LISTEN` and nearby fallback listeners with
`lsof -nP -iTCP:<chosen-port>-<chosen-port+40> -sTCP:LISTEN`. Stop only a
confirmed stale Vite process: press Ctrl-C in its terminal, or use `kill <PID>`
only when the terminal is gone. Do not kill a listener already serving an
active tester session.

```sh
npm run playtest:serve
```

Use the printed local URL for desktop or same-machine testing. For real phone or
tablet touch tests on the same trusted network, run:

```sh
npm run playtest:serve:lan
```

These commands pin port `5173` with `--strictPort`; if the port is occupied by
the wrong listener, inspect the listener, stop only a confirmed stale Vite
process, or use the doctor-suggested free port and pass that same port to the
serve and brief commands. Confirm Vite prints a Network URL for the touch
device, then stop the LAN server when the session is done because it binds
beyond localhost. Print the operator brief for the chosen port:

```sh
npm run playtest:brief
```

This prints current note status, the recommended tester launch,
copy-ready session-metadata lines, next session note target, mobile-session requirement,
and evaluator sequence. It also checks the requested strict port. If that port
is already listening, the brief probes candidate reset-safe launch URLs. When a
candidate is already serving the Tokenization Training shell, the brief
keeps the requested port only if that launch can be used for the next note.
With the default host list, localhost is checked first so stale LAN addresses
do not block desktop shakedown. If the next note must satisfy the mobile gate,
the brief also probes Network-host launch URLs on the requested port. When
localhost passes but those Network-host checks fail, treat the requested port
as same-machine-only and use the suggested free port for LAN serving and
planned launch links. The brief does not print copy-ready metadata for that
suggested port until launch-check passes on the exact host. If the listener is
the wrong app or does not answer, the brief switches its serve command to the
suggested free port and tells you which port to use consistently. If you chose
a non-default port, use that port explicitly:

```sh
npm run playtest:brief -- --port <chosen-port>
```

After starting the server, verify that the selected launch URL serves the game
shell:

```sh
npm run playtest:launch-check -- --port <chosen-port>
```

Without an explicit `--host`, launch-check probes candidate launch URLs and may
select same-machine proof so stale LAN addresses do not create a false setup
failure. It catches wrong ports, stale hosts, or missing servers before the
tester arrives, but it does not replace the physical-device sanity check.
Phone/tablet sessions still need
`npm run playtest:launch-check -- --host <network-host> --port <chosen-port>`
and the actual device must open the same URL and stop at the menu.
When an explicit LAN launch-check fails, the command runs a same-machine same-port
diagnosis. If that local check passes while the LAN URL
fails, keep metadata blocked and inspect the trusted network, the exact host
from Vite's Network URL, and macOS firewall or VPN isolation before retrying.

For physical phone/tablet sessions, open the Recommended tester launch URL on
the actual device before the tester arrives and stop at the menu. If the URL
does not load, confirm the device is on the same trusted network, copy the
exact host from Vite's Network URL, and rerun:

```sh
npm run playtest:brief -- --host <network-host> --port <chosen-port>
npm run playtest:launch-check -- --host <network-host> --port <chosen-port>
```

Use the script's Recommended tester launch URL for the session. Copy the
printed `Network` and `Launch URL` lines into the session metadata before the
tester starts only when the command presents them as copy-ready metadata, so the
evaluator can verify reset-safe launch provenance. If it prints `Do not copy
same-machine metadata into the required mobile note`, do not paste the
localhost/same-machine URL into that note; start LAN serving, rerun the brief
with the exact Vite Network host, and copy LAN metadata only after a passing
check. If `launch-check` prints `Do not copy launch metadata from this failed
check`, treat the printed URL as a failed candidate rather than session
metadata.
If the brief says the next session note is required to be the real
phone/tablet touch session, do not spend that note on another desktop run.
For a phone/tablet note to count toward the mobile gate, `Network` must be
`LAN` and `Launch URL` must use Vite's Network host, not `localhost` or
`127.0.0.1`.
Run `npm run playtest:links` only when you need the full reset-safe deep-link
list for controlled QA routes. Treat its launch metadata as planned setup only;
copy session metadata only after `playtest:brief` or `playtest:launch-check`
presents it as copy-ready for the exact running host.
Run `npm run playtest:qa-links` only for internal visual QA before a session;
those URLs use `qaViewport` and `qaFreezeElapsedMs`, so they are not tester
launch URLs and do not count as real mobile evidence.

- `?mode=tutorial`: start directly in Tutorial
- `?mode=endless`: start directly in Endless Training
- `?mode=tutorial-complete`: start directly at the tutorial handoff screen for
  layout and screenshot checks
- `?mode=results`: start directly at a zero-round results screen for layout,
  Copy Summary, and ledger fallback checks
- `?mode=protocol-results`: start directly at a representative post-handoff
  results screen for Copy Summary payload QA
- `?playtestReset=1`: clear saved high score and mute state before launch
- no mode: start at Main Menu

For a new tester on a reused browser, start from:

```text
/?playtestReset=1
```

Use `?mode=tutorial&playtestReset=1` or
`?mode=endless&playtestReset=1` only when testing a specific mode directly.

## Session Structure

Use `docs/playtest_facilitator_card.md` beside the tester. It is the
table-side no-coaching script. Use `docs/playtest_day_checklist.md` as the
short operator checklist, and use `docs/playtest_session_notes_template.md` for
each tester.
To create `docs/playtests/session-1.md` through `docs/playtests/session-5.md`
without overwriting completed notes, run:

```sh
npm run playtest:notes
```

1. Start at the main menu.
2. Ask the tester to read the screen and say what they think the game is asking
   them to do.
3. Run the full tutorial without external explanation unless the tester is
   blocked for more than 30 seconds.
4. After the tutorial-complete handoff appears, wait to see whether the tester
   starts Endless Training without prompting. If they do not act for 30 seconds,
   ask them what they think the screen is offering.
5. Ask the tester to play Endless Training until budget exhaustion or voluntary
   quit after at least five rounds.
6. On the results screen, ask the tester to press Copy Summary and paste the
   copied text into the playtest notes. If the button changes to Save Summary,
   press it and paste the downloaded text file instead. Confirm that the
   summary includes run ID, start source, input modality, fixture round trace,
   OK, missed, and false cut counts, total net, and best-saved record.
7. Record a short debrief.
8. After the tester leaves, run `npm run playtest:status` and fill any missing
   note sections before starting the next session. Treat `Ready for rollup
   evaluator: no` as authoritative when the only remaining gap is the real
   phone/tablet touch session. A phone-like note with incomplete required
   sections is only mobile metadata, not completed mobile evidence. The status
   report also treats observation/pass-criteria contradictions as incomplete
   pass-criteria evidence; do not smooth a failed or ambiguous observation into
   a pass row. Use the
   status report's immediate next commands to recover the physical-device,
   evaluator, rollup, or audit sequence for the current evidence state.

Target session length: 10 to 15 minutes.

After five sessions, use `docs/playtest_rollup_template.md` to tally the pass
criteria. Treat missing, ambiguous, or contradictory evidence as a failed gate
until it is clarified by another session or a targeted retest.
The rollup also requires a principle-embodiment audit against
`docs/game_design_principles.md`; a threshold pass is not enough unless the
notes prove the loop, critical frame, emotional design, game feel, and visual
display claims.
To create a non-overwriting completed-rollup file from the template, run:

```sh
npm run playtest:rollup
```

Then run the evaluator against the five completed note files:

```sh
npm run playtest:evaluate -- docs/playtests/session-1.md docs/playtests/session-2.md docs/playtests/session-3.md docs/playtests/session-4.md docs/playtests/session-5.md
```

After filling the rollup and saving it as a completed artifact, run:

```sh
npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md
```

To audit the whole package after those two evaluator commands, run:

```sh
npm run playtest:audit
```

This command checks that the reading notes, concept notes, principles, QA
evidence, playtest protocol files, five session notes, real-device mobile gate,
completed rollup, and rollup/session consistency all exist and pass their
validators. Browser QA PNGs must be structurally complete files at the expected
QA viewport dimensions, not only large enough on disk. It exits non-zero until
the external session evidence and rollup are complete.
For the pre-session local package check only, run `npm run playtest:audit:local`;
that command intentionally excludes session and rollup gates.

It exits non-zero if the notes do not prove the gates: wrong session count,
blank session metadata, template-placeholder metadata values, blank or ambiguous
pass cells, verdicts without evidence text, blank or bare debrief answers,
debrief answers that do not address their specific question, missing
copied-summary fields, blank or bare observation-note rows, generic principle
evidence notes, generic pass evidence that does not name the criterion-specific
observed behavior, contradictions between matching observation rows and
pass-criteria rows, or no real phone/tablet session with touch, pen, or mixed
input, `Network: LAN`, and a non-localhost `Launch URL` for the mobile
readability criterion. Session metadata and copied summaries must also keep the
game-generated `mtt-...` run ID shape; do not replace it with a participant ID
or spreadsheet row label.
One-word evidence cells and debrief answers such as `pass`, `yes`, `ok`,
`fail`, or `ambiguous` are treated as missing evidence. The copied summary must
also match the session run ID, and the post-tutorial Endless run must report
`Start: handoff screen`. It must also include a captured `Round trace` rather
than `Round trace: not captured`.
The copied `Input evidence:` line records what pointer type the browser reported
during play. It supports the note, but it is not enough for the mobile gate
without real-device `Device/browser`, `Network: LAN`, non-localhost Launch URL,
and concrete visual evidence.
For a mobile readability pass, the note must also name a concrete visual
artifact or observation and at least one readable surface or failure mode:
HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap,
or finger occlusion. `Looked fine` is not enough evidence.

For the mobile readability gate, the evaluator only counts a session when
`Device/browser` names a phone, tablet, iPad, iPhone, Android, or mobile browser
and `Input` is `touch`, `pen`, or `mixed`, with `Network: LAN` and a launch URL
using the Vite Network host. `localhost`, `127.0.0.1`, desktop touchscreens,
trackpads, and browser emulation do not prove real phone/tablet readability.
The rollup evaluator also requires filled session-index rows, threshold counts,
non-generic evidence, supported decisions for the five principle areas, no
unresolved major principle gaps, and an explicit broader-playtest-ready decision.
The final readiness audit cross-checks the completed rollup against the
evaluated session notes, including run IDs, input, copied-summary start source,
notes file references, and pass-count tallies.

Observation rows and pass-criteria rows must not contradict each other. If a
matching observation row is `fail` or `ambiguous`, do not mark the matching pass
criterion as `pass`; if the matching observation row is `pass`, do not mark the
matching criterion as `fail`.

## Observation Checklist

Record the following without correcting the player mid-round:

- first-action hesitation before the first swipe
- whether the player understands that pale guides are legal slots, not answers
- whether the player over-cuts spaces
- whether a restarted swipe on a visible blank run creates only one slice, not
  a second following-word slice
- whether returning to the centered blank slot cleans accidental ordinary-word
  duplicates without suppressing deliberate currency or punctuation token cuts
- whether the player uses Clear Cuts
- whether the player trusts snap positions
- whether the static prompt stays centered in the active lane and clear of HUD,
  Wiener speech, review evidence, feedback, and controls
- whether the near-text Wiener speech is noticed without requiring the player to look for a second panel
- whether the Wiener tutorial speech explains both the labor/browser situation
  and tokenizer mechanics without facilitator explanation
- whether missed and false markers are understood during review
- whether pay, cost, net, balance, and rank are understood
- whether the tutorial-complete handoff gets the player into Endless Training
- whether dense strings feel like higher-risk tokenization, not random noise
- whether the obsolete AI labor frame is noticed through play
- whether the degraded visual style reads as intentional and whether the player
  asks for, chooses, or seems pulled toward another round
- whether mistakes feel earned and recoverable rather than arbitrary
- whether the prompt, action, review evidence, economy consequence, and next
  step form a legible loop
- whether Copy Summary works on the results screen and preserves start source,
  input modality, run ID, fixture round trace, cut-error counts, and total net
- any mobile finger occlusion or unreadable HUD/copy issues
- whether a screenshot, phone photo, screen recording, or explicit observer note
  captured the mobile readability state

## Debrief Questions

Ask after play, not during active rounds:

1. What were you trying to do when you swiped?
2. What is a token boundary, based on the game?
3. Name one way tokenization differs from ordinary word reading.
4. What made pay go up or company cost go up?
5. Did any result feel unfair or caused by input imprecision?
6. What did the AI/browser fiction make you think was happening?
7. Which screen or moment was hardest to read?
8. What made you want to keep playing or stop?

## Pass Criteria

The build is ready for broader playtest only if:

- at least 4 of 5 testers can perform the first tutorial action without outside
  instruction
- at least 4 of 5 can explain one non-word tokenization behavior after tutorial
- at least 4 of 5 can start Endless Training from the tutorial-complete handoff
  without outside instruction
- at least 4 of 5 can explain pay minus cost equals net after a review state
- no tester reports systematic swipe/snap mistrust
- mobile testers can read the HUD, text panel, review markers, feedback card,
  and Wiener speech without overlap or clipping
- at least 3 of 5 notice the degraded AI labor frame without being told
- at least 3 of 5 show engagement and describe the degraded visual style as
  intentional rather than broken or accidental
- at least 4 of 5 can return a copied playtest summary from the results screen,
  including the current run ID, start source, input modality, fixture round
  trace, cut-error counts, total net, and best-saved record

## Known Risks To Watch

- The fixture corpus now has broader first-playtest coverage, but longer
  sessions may still repeat safe categories before mastery is stable.
- Some real tokenizer outputs are intentionally excluded because their byte
  boundaries cannot be displayed safely at grapheme boundaries yet.
- Compact mobile layout has in-app browser screenshot evidence, but still needs
  real-device touch evidence. Use `npm run playtest:serve:lan` for same-network phone or
  tablet sessions. If automated screenshot capture fails, collect a device
  screenshot, phone photo, screen recording, or explicit observer note naming
  the relevant readable surfaces and any clipping, overlap, or finger occlusion.
- Economic tuning is not validated against real player behavior.
- Clipboard access can still vary by browser. Copy Summary first uses the async
  clipboard API, then a legacy textarea copy fallback. If both fail, the button
  changes to Save Summary; press it to download the same full text summary. If
  that also fails and the button changes to Use Ledger Text, record a screenshot
  or transcribe the result ledger, but mark the copied-summary criterion as
  failed because the ledger does not contain the full fixture round trace. The
  visible ledger uses a compact run/start/input trace line plus OK/M/F notation
  for correct, missed, and false cuts.
- The copied summary records a UTC run ID so pasted summaries, screenshots, and
  notes can be matched after the session.
- The copied summary records observed pointer modality as mouse, touch, pen,
  mixed, unknown, or not captured. Treat it as supporting evidence, not a
  replacement for observing the actual device and tester behavior. Trackpads
  usually record as mouse-like pointer input.
- The copied summary records session start source as menu, direct, handoff
  screen, results retry, or not captured. For the main protocol, the expected
  post-tutorial endless run should report `Start: handoff screen`.
- The copied summary records a per-round fixture trace with fixture ID,
  category, tier, token count, and OK/missed/false counts. Use it to identify
  which examples actually produced confusion or apparent mastery.
