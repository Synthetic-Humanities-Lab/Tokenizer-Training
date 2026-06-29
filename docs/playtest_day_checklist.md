# Playtest Day Checklist

Use this as the operator checklist for the first five-user playtest. It does
not replace `docs/user_playtest_protocol.md`; it keeps the session sequence
short enough to follow while a tester is present.

## Mobile Note Validity Checklist

Until the status report shows one completed real mobile/touch note, the
required mobile note counts only when it uses a real phone/tablet/mobile
browser with touch, pen, or mixed input, records `Network: LAN`, records a
non-localhost `Launch URL` after explicit `--host <network-host>` launch-check
passes, opens that same URL on the actual device at the menu, and names
concrete visual evidence for HUD, static prompt text, review markers, feedback,
Wiener speech, clipping, overlap, or finger occlusion. If any piece fails, leave the
mobile note blank and fix the LAN path instead of using same-machine proof.

## Before The First Tester

1. Run `npm install` if dependencies may be stale.
2. Run `npm run playtest:preflight`.
3. Run `npm run playtest:notes` if the five note files do not already exist.
4. Run `npm run playtest:doctor` before starting the server. If it reports port
   `5173` is occupied, check whether it proves the current port is already
   serving the game shell. If so, keep that port unless the next note must
   satisfy the mobile gate and the doctor reports that Network-host launch
   checks failed. In that same-machine-only case, use the suggested free port
   for the phone/tablet session. If the listener is wrong or dead, inspect the
   printed `Port hygiene` commands, stop only a confirmed stale Vite process,
   or use the suggested free port. Use the selected port for serve, brief, QA
   links, and session metadata. The doctor prints the Recommended tester launch
   URL and copy-ready metadata lines only when the selected launch can be used
   for the next note. If it prints `Port hygiene`, inspect the requested
   listener with `lsof -nP -iTCP:<chosen-port> -sTCP:LISTEN` and
   nearby fallback listeners with
   `lsof -nP -iTCP:<chosen-port>-<chosen-port+40> -sTCP:LISTEN`. Stop only a
   confirmed stale Vite process: press Ctrl-C in its terminal, or use
   `kill <PID>` only when the terminal is gone. Do not kill a listener already
   serving an active tester session.
5. Start the server:
   - desktop or same-machine: `npm run playtest:serve`
   - real phone/tablet: `npm run playtest:serve:lan` on a trusted network
6. These commands use strict port `5173`. If that port is occupied by the
   wrong listener, inspect the listener, stop only a confirmed stale Vite
   process, or use the doctor-suggested port everywhere. For a non-default
   phone/tablet port, start LAN serving with
   `npm run playtest:serve:lan -- --port <chosen-port>`.
7. Run `npm run playtest:brief`. If the brief says the selected launch URL is
   already serving the game shell, keep that port only when its printed
   metadata is valid for the next note. If the next note must satisfy the
   mobile gate and localhost passes while Network-host launch checks fail,
   treat the requested port as same-machine-only and use the suggested free
   port. If it falls back to same-machine metadata, rerun with the exact Vite
   Network host before using a phone/tablet note for the mobile gate. If it
   reports a blocked or wrong listener and switches to a suggested free port,
   start the server with that port, rerun launch-check for the exact host, and
   copy metadata only after the game shell passes.
   If you chose a non-default port, rerun with
   `npm run playtest:brief -- --port <chosen-port>`.
8. After the server is running, run
   `npm run playtest:launch-check -- --port <chosen-port>` to confirm the
   selected reset-safe launch URL serves the game shell. Without an explicit
   host, launch-check may select same-machine proof; for a phone/tablet note,
   rerun it with `--host <network-host>` using the exact Vite Network host.
   If that LAN check fails but the same-machine same-port diagnosis passes,
   the shell is running locally; check the trusted network, exact Vite Network
   URL host, and macOS firewall or VPN isolation before retrying.
9. Open the Recommended tester launch URL. Use `npm run playtest:links` only
   when you need the full deep-link list; treat any launch metadata it prints
   as planned setup until brief or launch-check marks the exact running host
   copy-ready.
10. Copy the printed `Network` and `Launch URL` lines into the session note
   before the tester starts only when the brief presents them as copy-ready
   metadata. Doctor or links output that says `Planned Network` or
   `Planned Launch URL` is not copy-ready; first start the selected server and
   rerun launch-check with the exact host. If it prints `Do not copy same-machine metadata into the required mobile note`,
   do not paste the localhost/same-machine URL into that note;
   start LAN serving, rerun the brief with the exact Vite Network host, and
   copy the `Network: LAN` metadata it prints after the phone/tablet loads.
11. Optional internal visual QA: run
   `npm run playtest:qa-links -- --port <chosen-port>` and use those links
   only for browser/canvas checks, not tester sessions or mobile evidence.
12. If the brief says the next session note is the required real phone/tablet
   touch session, run that named note on the physical device.
13. For a physical phone/tablet session, open the Recommended tester launch URL
    on the actual device before the tester arrives and stop at the menu. If it
    does not load, rerun
    `npm run playtest:brief -- --host <network-host> --port <chosen-port>`
    and `npm run playtest:launch-check -- --host <network-host> --port <chosen-port>`
    using the exact host from Vite's Network URL.
14. Confirm any mobile-gate note records `Network: LAN` and a Launch URL using
    Vite's Network host, not `localhost` or `127.0.0.1`.
15. Keep `docs/playtest_facilitator_card.md` visible. Do not pre-explain
   tokenization, the Wiener, the labor fiction, or pay/cost rules.

## During Each Session

1. Start at `/?playtestReset=1`.
2. Ask only: "Please read the screen first, then say what you think the game is
   asking you to do."
3. Let the tutorial teach. If the tester is blocked for more than 30 seconds,
   ask: "What do you think this screen is asking you to do?"
4. Record whether the first swipe, pale guide meaning, space cuts, restarted
   blank-run swipes, return-to-space cleanup of accidental ordinary-word
   duplicates without suppressing deliberate currency or punctuation token cuts,
   static prompt clearance, near-text Wiener speech, Wiener tutorial speech,
   review markers, pay/cost/net, and tutorial-complete handoff were understood
   without explanation.
5. For any phone/tablet session, record a screenshot, photo, screen recording,
   or explicit observer note naming the readable surface or failure mode: HUD,
   static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or
   finger occlusion.
6. Ask the tester to play Endless Training until budget exhaustion or voluntary
   quit after at least five rounds.
7. On the results screen, ask the tester to press Copy Summary. If it changes
   to Save Summary, press it and paste the downloaded text file instead.
8. Paste the summary into the session note and copy its `Run ID` into Session
   Metadata. Confirm the pasted text includes `Input evidence:`; that line
   supports pointer-type evidence but does not satisfy the mobile gate by
   itself.
9. Ask the eight debrief questions from `docs/user_playtest_protocol.md`.

## After Each Session

1. Fill every metadata field, observation row, pass-criteria row, debrief
   answer, and principle-evidence note in that tester's session file.
2. Run `npm run playtest:status` to catch incomplete notes before the next
   tester arrives. Use its immediate next commands to recover the right
   physical-device, evaluator, rollup, or audit sequence for the current state.
3. If the report still says `Ready for rollup evaluator: no` because the real
   phone/tablet touch session is missing, schedule a physical-device session
   with `Network: LAN` and a non-localhost Launch URL before rollup.
4. Preserve contradictions. Do not convert hesitation, confusion, or input
   mistrust into a pass because the tester eventually succeeded.
5. Keep matching observation rows and pass-criteria rows consistent; if one
   records fail or ambiguous for the same behavior, do not mark the paired row
   as pass.
6. For the main protocol, confirm the copied summary includes:
   - `Run ID`
   - `Start: handoff screen`
   - input modality
   - `Input evidence`
   - round trace with fixture IDs
   - OK/missed/false counts
   - net
   - best saved record

## After Five Sessions

1. Run:

   ```sh
   npm run playtest:evaluate -- docs/playtests/session-1.md docs/playtests/session-2.md docs/playtests/session-3.md docs/playtests/session-4.md docs/playtests/session-5.md
   ```

2. Run `npm run playtest:rollup` if `docs/playtest_rollup_completed.md` does
   not exist.
3. Fill the completed rollup from the five notes. The principle audit must cite
   concrete session evidence for top game design, critical/conceptual play,
   emotional design, game feel, and optimal visual display.
4. Run:

   ```sh
   npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md
   ```

5. Run:

   ```sh
   npm run playtest:audit
   ```

The design is not ready for broader playtest until the session evaluator, rollup
evaluator, and readiness audit all pass. At least one real phone/tablet touch
session with concrete readability evidence is required.
