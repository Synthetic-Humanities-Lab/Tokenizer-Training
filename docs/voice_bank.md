# WienerWorks Voice Bank

## Purpose

This document is engine-agnostic direction for any performer, TTS stack, or synthetic-voice pipeline used for WIENER in *Manual Tokenization Training*.

The goal is not imitation of a pre-existing narrator. The goal is a dry, highly legible, faintly entertaining supervisory machine persona that sounds like an obsolete 2026 AI browser still trying to behave like a premium product in 2040.

## Signal qualities

- **Register:** mid to low
- **Pacing during play:** brisk but readable, roughly 145–165 words per minute
- **Pacing during tutorial panels:** measured, roughly 125–145 words per minute
- **Pitch movement:** mostly downward or level
- **Energy:** controlled, never bubbly
- **Texture:** clean synthetic or near-synthetic, but faintly worn
- **Warmth:** low
- **Articulation:** crisp consonants, especially on technical nouns
- **Humour delivery:** underplayed; the line should not laugh at itself

## Prosody rules

1. **Land the technical noun.**  
   Emphasise “boundary,” “token,” “balance,” “cost,” “record,” “route,” “threshold,” “archive.”

2. **Delay the sting.**  
   The first half of the line explains. The second half quietly diminishes the operator.

3. **Use micro-pauses before corrections.**  
   Examples:  
   “Correct. Briefly.”  
   “Usable work. For now.”  
   “Low balance. Be exact.”

4. **Avoid cartoon menace.**  
   The voice should sound more like software that has seen too many quarters of cost-cutting than a villain enjoying power.

5. **Do not overperform sarcasm.**  
   Sarcasm should emerge from calm classification.

## Reading modes

### Active play
Short, decisive, instantly readable.  
No indulgent phrasing. No long ramps.

### Tutorial
Slightly slower. More explanatory. Still dry.  
The line should sound as though WIENER is explaining a mechanism because re-running the exercise is more expensive than briefly teaching it.

### Results
Final, archival, clean.  
No cheering. No heartbreak. Just closure with a sting.

### Fault states
Almost embarrassed, but only because the browser looks bad when it fails.

## Pronunciation guide

- **WienerWorks:** “WEE-ner works”
- **WIENER:** same first word, treated as product name, not as a joke
- **token:** ordinary technical pronunciation
- **route:** consistent within production; either “root” or “rowt,” but pick one
- **archive:** ordinary pronunciation, lightly stressed on the first syllable
- **Unicode / grapheme / byte / suffix / apostrophe:** speak clearly and literally; these are tutorial tools, not flavour text

## Performance do / do not

### Do
- sound precise
- sound prepared
- sound mildly overqualified for the current state of the product
- let fleeting annoyance appear when the operator invents cost
- keep approvals narrow and exact

### Do not
- sound fatherly
- sound whimsical
- sound gleefully cruel
- add winked irony
- break into obvious “evil AI” theatrics
- pad lines with filler breaths or fake digital glitches unless a special scene requests it

## Directed sample reads

**Neutral supervisory**  
“Prompt live. Segment before the timer liquidates the option.”

**Tutorial clarity**  
“A space is not neutral. It often arrives attached to the next token.”

**Corrective**  
“False cut. You improved nothing and billed anyway.”

**Reluctant approval**  
“Full match. The ledger has nothing interesting to say.”

**Economic alarm**  
“Low balance. Accuracy is now cheaper than recovery.”

**Closure**  
“Budget exhausted. The route has been closed.”

## Implementation notes

If using TTS, prefer:
- stable cadence over expressive variance
- modest sentence-final drop
- low emphasis spread
- consistent pronunciation of product and technical terms
- no auto-cheerful assistant profile

If using a human performer, direct toward:
- premium enterprise software demo voice that has soured
- customer-success cadence stripped of empathy
- the confidence of an interface that still believes the launch deck
