# Numerical Token Comprehension Probe

Use this protocol to test the mental model introduced by the tutorial and review
record. It is a research instrument, not a game mode, score, progression gate,
or substitute for the main five-session playtest.

## Claims Under Test

1. Ordinary words and tokenizer chunks are not the same unit.
2. A visible space can belong to the token chunk that follows it.
3. A token ID is an encoding-specific vocabulary identifier, not a score, cost,
   rank, rarity, confidence value, or semantic meaning.

Cut accuracy does not prove these claims. The tutorial includes target-assisted
rounds, and a scored transfer fixture would confound conceptual understanding
with swipe precision, timing, and the economy.

## Session Boundary

- Run five dedicated novice sessions after the participant completes Tutorial.
- Stop at the Tutorial Cleared screen, before Token Log or Training.
- These sessions do not count toward the main protocol's unprompted handoff
  criterion because the probe deliberately interrupts that moment.
- Use Form A for odd-numbered participants and Form B for even-numbered
  participants.
- Record the first answer verbatim. The only neutral follow-up is `Tell me why.`
- After the reason, record confidence as `guess`, `somewhat sure`, or `sure`.
- Do not reveal correctness, open Token Log, repeat tutorial wording, or coach
  the participant until all three items are complete.
- Confidence is diagnostic only. It never changes the score.

## Form A

### Item 1 - Words And Chunks

`don't split that yet` has four ordinary words. Must `cl100k_base` produce
exactly four tokens? Tell me why.

Verified reference: five chunks - `<don> <'t> <␠split> <␠that> <␠yet>`.

### Item 2 - Space Ownership

Show:

`<don> <'t> <␠split> <␠that> <␠yet>`

Which token owns the visible space before `that`? Is the space a separate token?
Tell me why.

### Item 3 - Encoding-Specific IDs

Show:

- `cl100k_base`: `<cat>->4719`
- `p50k_base`: `<cat>->9246`

Is `9246` a higher score? Must the same text keep the same ID in another
encoding? Tell me what the numbers represent.

## Form B

### Item 1 - Words And Chunks

`we're testing tokens now` has four ordinary words. Must `cl100k_base` produce
exactly four tokens? Tell me why.

Verified reference: five chunks - `<we> <'re> <␠testing> <␠tokens> <␠now>`.

### Item 2 - Space Ownership

Show:

`<we> <'re> <␠testing> <␠tokens> <␠now>`

Which token owns the visible space before `tokens`? Is the space a separate
token? Tell me why.

### Item 3 - Encoding-Specific IDs

Show:

- `cl100k_base`: `<dog>->18964`
- `p50k_base`: `<dog>->9703`

Is `18964` a higher score? Must the same text keep the same ID in another
encoding? Tell me what the numbers represent.

## Item Rubric

Score each item independently as `pass`, `ambiguous`, or `fail`.

- **Item 1 pass:** says no and explains that tokenizer chunks need not align
  one-to-one with ordinary words. A correct yes/no answer without that reason is
  ambiguous.
- **Item 2 pass:** identifies the marked following token and explains that the
  space is inside that chunk rather than a separate token or part of the previous
  chunk.
- **Item 3 pass:** says the larger number is not a higher score, says the IDs need
  not match across encodings, and describes them as vocabulary identifiers or
  lookup keys. Any claim that magnitude means quality, cost, rarity, or meaning
  fails the item.
- A participant passes only with three item passes and three valid reasons.
- A confident wrong answer is logged as a misconception; it is not softened to
  ambiguous.

## Decision Threshold

Keep the Loop 10 teaching treatment only if:

- at least 4 of 5 novices pass each individual claim; and
- at least 4 of 5 novices pass all three items without coaching.

This threshold is a project decision aligned with the existing formative
playtest gate. Five participants can support a bounded design iteration; they do
not establish a general learning-effect claim.

## Optional Token Log Reference-Use Check

Run this only after all three comprehension items and their first answers have
been recorded. It evaluates the Token Log interface, not recall, transfer, or
the Loop 10 teaching-treatment score.

1. Return to the menu and say: `Open Token Log.` Do not identify the button or
   explain the screen.
2. Ask: `Which examples are recently reviewed, and which are reference
   examples?`
3. Ask: `Find the first token chunk on this screen that begins with the visible
   space marker. What exact cl100k_base ID is paired with it?`
4. Record the visible fixture, chunk, expected ID, first answer, and elapsed time.
   Do not coach, point, read the mapping aloud, or accept a nearby number.

Pass requires both correct provenance classification and the exact ID paired
with the chosen space-bearing chunk. Keep the structured Token Log treatment
only if at least 4 of 5 novices pass both tasks without coaching. This is a
formative reference-use gate: it does not establish durable learning, retrieval
practice, transfer, or whole-app accessibility.

## Participant Record

- Participant ID:
- Date:
- Form: A / B
- Device:
- Tutorial completed without facilitator explanation: yes / no
- Item 1 first answer:
- Item 1 reason:
- Item 1 confidence: guess / somewhat sure / sure
- Item 1 result: pass / ambiguous / fail
- Item 2 first answer:
- Item 2 reason:
- Item 2 confidence: guess / somewhat sure / sure
- Item 2 result: pass / ambiguous / fail
- Item 3 first answer:
- Item 3 reason:
- Item 3 confidence: guess / somewhat sure / sure
- Item 3 result: pass / ambiguous / fail
- Overall result: pass / ambiguous / fail
- Misconception or contradiction notes:
- Token Log check run: yes / no
- Token Log visible fixture and chunk:
- Token Log expected ID:
- Token Log provenance first answer:
- Token Log ID first answer:
- Token Log elapsed time:
- Token Log result: pass / fail

## Evidence Basis

- [OpenAI tiktoken](https://github.com/openai/tiktoken/blob/main/README.md)
  defines tokenization as conversion to numeric token sequences and distinguishes
  named encodings.
- [Roediger and Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)
  distinguishes retrieval performance from passive restudy; project inference:
  require an answer rather than recognition alone.
- [Butler 2010](https://pubmed.ncbi.nlm.nih.gov/20804289/) supports inferential
  transfer from retrieval practice; project inference: use unseen examples.
- [Knowing What Students Know](https://nap.nationalacademies.org/catalog/10019/knowing-what-students-know-the-science-and-design-of-educational-assessment)
  frames assessment as alignment among cognition, observation, and interpretation;
  project inference: score each proposition with a predeclared rubric.
