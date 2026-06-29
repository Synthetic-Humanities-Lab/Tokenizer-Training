# Tokenizer Training Facilitator Card

Table-side script for a single tester session. Use the full protocol in
`docs/user_playtest_protocol.md` for setup details and use
`docs/playtest_session_notes_template.md` for notes.

## Mobile Note Validity Checklist

Until `npm run playtest:status` reports a completed real mobile/touch note,
the next required mobile note is valid only if all of these are true:

- The tester uses a real phone/tablet/mobile browser with touch, pen, or mixed
  input; desktop emulation, trackpads, and desktop touchscreens do not count.
- The note records `Network: LAN` and a non-localhost `Launch URL` copied only
  after `npm run playtest:launch-check -- --host <network-host> --port
  <chosen-port>` passes and the actual device reaches the menu.
- The observation or visual-evidence field names a concrete surface or failure
  mode: HUD, static prompt text, review markers, feedback, Wiener speech, clipping,
  overlap, or finger occlusion.
- If any condition fails, leave the required mobile note blank rather than
  filling it from same-machine or failed LAN proof.

## Before The Tester Arrives

- Run `npm run playtest:preflight`.
- Run `npm run playtest:notes` if the five session note files do not exist yet.
- Run `npm run playtest:doctor` before starting the server. If port `5173` is
  occupied, the doctor probes candidate reset-safe launch URLs before calling
  it stale. If it proves the current port is already serving the game shell,
  keep that port. If the next note must satisfy the mobile gate and localhost
  passes but every Vite Network-host probe fails, treat the requested port as
  same-machine-only and use the suggested free port for the phone/tablet
  session. If the listener is wrong or dead, inspect the printed `Port hygiene`
  commands, stop only a confirmed stale Vite process, or use the suggested free
  port. Use the selected port for serve, brief, and links. The doctor prints
  the Recommended tester launch URL and copy-ready session-metadata lines only
  when the selected launch can be used for the next note. If it prints
  `Port hygiene`,
  inspect the requested listener with
  `lsof -nP -iTCP:<chosen-port> -sTCP:LISTEN` and nearby fallback listeners with
  `lsof -nP -iTCP:<chosen-port>-<chosen-port+40> -sTCP:LISTEN`. Stop only a
  confirmed stale Vite process: press Ctrl-C in its terminal, or use
  `kill <PID>` only when the terminal is gone. Do not kill a listener already
  serving an active tester session.
- Start a controlled menu session from `/?playtestReset=1`.
- For phone or tablet sessions, run `npm run playtest:serve:lan` on a trusted
  network, then run `npm run playtest:brief`. The serve command pins strict
  port `5173`; if that port is occupied by the wrong listener, inspect the
  listener, stop only a confirmed stale Vite process, or use the
  doctor-suggested free port and rerun the brief with
  `npm run playtest:brief -- --port <chosen-port>`. The brief now checks the
  requested port itself. If a candidate reset-safe launch URL is already
  serving the Tokenizer Training shell, keep that port only when the
  launch metadata is valid for the next note. If the next note must satisfy the
  mobile gate and localhost passes while Network-host launch checks fail, treat
  the requested port as same-machine-only and use the suggested free port. If
  the brief falls back to same-machine metadata, rerun it with the exact Vite
  Network host before using a phone/tablet note for the mobile gate. If the
  listener is blocked by the wrong app or does not answer, start the server
  with the suggested free port and treat the printed launch metadata as planned
  until launch-check passes on the exact host. After starting the server, run
  `npm run playtest:launch-check -- --port <chosen-port>` to confirm the
  selected reset-safe launch URL serves the game shell. Without an explicit
  host, launch-check may select same-machine proof; for a phone/tablet note,
  rerun it with `--host <network-host>` using the exact Vite Network host. If
  that LAN launch-check fails but the same-machine same-port diagnosis passes,
  the shell is running locally; check the trusted network, Vite's exact Network
  URL host, and macOS firewall or VPN isolation before retrying. Use the script's
  Recommended tester launch URL, and copy its Network and Launch URL lines into
  the session metadata only when the brief or launch-check presents them as
  copy-ready. Doctor or links output labelled `Planned Network` or
  `Planned Launch URL` is not copy-ready. If it
  prints `Do not copy same-machine metadata into the required mobile note`, do
  not paste the localhost/same-machine URL into that note; start LAN serving,
  rerun the brief with the exact Vite Network host, and copy the `Network: LAN`
  metadata it prints after the phone/tablet loads. If the brief says the next session note is required
  to be the real phone/tablet touch session, use that physical device for the
  named note file. That note only satisfies the mobile
  gate when metadata says `Network: LAN` and the Launch URL uses Vite's Network
  host, not `localhost` or `127.0.0.1`. Before the tester arrives, open the Recommended tester
  launch URL on the actual device and stop at the menu. If it does not load,
  rerun `npm run playtest:brief -- --host <network-host> --port <chosen-port>`
  and `npm run playtest:launch-check -- --host <network-host> --port <chosen-port>`
  using the exact host from Vite's Network URL. Use `npm run playtest:links`
  only when you need the full QA deep-link list, and treat its launch metadata
  as planned setup until brief or launch-check marks the exact running host
  copy-ready.
- Do not pre-explain tokenization, the Wiener, the labor fiction, or
  the pay/cost system.

## Opening Script

Say:

```text
Please read the screen first, then say what you think the game is asking you to do.
```

Then let the tutorial and Wiener teach. The tester's first
misreading is evidence, not a problem to repair.

## Intervention Rule

Do not correct during rounds. If the tester is blocked for more than 30 seconds,
ask only:

```text
What do you think this screen is asking you to do?
```

Record that prompt as outside instruction. Do not explain tokenization until
the debrief.

## Watch During Play

- First swipe hesitation or confident first action.
- Whether pale guides read as legal slots, not answer hints.
- Whether spaces are over-cut or sliced twice.
- Whether a restarted swipe on a visible blank run still leaves only one cut.
- Whether returning to the centered blank slot cleans accidental ordinary-word
  duplicates without suppressing deliberate currency or punctuation token cuts.
- Whether Clear Cuts is noticed before panic.
- Whether snap positions feel trustworthy.
- Whether the static prompt stays centered in the active lane and clear of HUD,
  Wiener speech, review evidence, feedback, and controls.
- Whether near-text Wiener speech is noticed without the tester looking for a
  second panel.
- Whether Wiener tutorial speech explains both the labor/browser situation and
  tokenizer mechanics without your explanation.
- Whether review markers explain OK, missed, and false cuts.
- Whether pay, company cost, net, balance, and rank are understood.
- Whether the tester starts Endless from the tutorial-complete handoff.
- Whether dense strings feel like risky tokenization, not random noise.
- Whether the degraded AI labor frame is noticed without being named.
- Whether errors feel earned and recoverable rather than arbitrary.
- Whether prompt, action, review evidence, economy consequence, and next step
  form a legible loop.
- Whether Copy Summary works on the results screen.
- Any mobile finger occlusion, unreadable HUD text, overlap, or clipping.
- For phone/tablet sessions, whether screenshot, photo, screen recording, or
  explicit observer-note evidence names the readable surfaces.

## Debrief Prompts

Ask after play, not during active rounds.

1. What were you trying to do when you swiped?
2. What is a token boundary, based on the game?
3. Name one way tokenization differs from ordinary word reading.
4. What made pay go up or company cost go up?
5. Did any result feel unfair or caused by input imprecision?
6. What did the AI/browser fiction make you think was happening?
7. Which screen or moment was hardest to read?
8. What made you want to keep playing or stop?

## Evidence Standard

- Record exact tester quote, action, timing, or contradiction.
- Evidence is not `pass`/`yes`, `ok`, `fail`, or `ambiguous`.
- Observation rows and pass-criteria rows must agree when they describe the
  same behavior; use the stricter result if a row is fail or ambiguous.
- Engagement/aesthetic evidence must name both continued play interest and the
  degraded visual style reading as intentional rather than broken.
- The mobile gate requires a real phone/tablet/mobile browser plus touch, pen,
  or mixed input, `Network: LAN`, and a non-localhost Launch URL. Desktop
  emulation, trackpads, and desktop touchscreens do not count.
- A mobile readability pass must name a concrete artifact or observation plus a
  surface or failure mode: HUD, static prompt text, review markers, feedback,
  Wiener speech, clipping, overlap, or finger occlusion.
- For the main protocol, the post-tutorial Endless summary must report
  `Start: handoff screen`.
- The final rollup must connect evidence back to the five principle areas:
  top game design, critical/conceptual play, emotional design, game feel, and
  optimal visual display.

## Closeout

- On the results screen, ask the tester to press Copy Summary.
- Paste the copied text into the notes. If the button changes to Save Summary,
  press it and paste the downloaded text file instead.
- Confirm the summary includes run ID, start source, input modality, `Input
  evidence`, fixture round trace, OK, missed, and false cut counts, total net,
  and best-saved record.
