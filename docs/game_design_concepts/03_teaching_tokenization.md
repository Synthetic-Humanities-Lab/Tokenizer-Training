# Concept 03 - Teaching Tokenization

Draws on: Zubek player experience and gameplay loops; Isbister agency;
Flanagan language games.

## Design Claim

The game teaches by making ordinary reading unreliable. The player learns to
shift from words and meaning to tokenizer-visible structure: leading spaces,
punctuation, dense strings, and byte-safe grapheme boundaries.

## Implementation Guidance

- Start with worked examples where target hints are visible.
- Remove explicit answers after the early tutorial.
- Introduce punctuation, contractions, dense strings, and economy in sequence.
- Keep feedback short and diagnostic: name the tokenization mistake first.
- Restrict playable fixtures to safe grapheme-aligned boundaries until the
  runtime can display unsafe cases honestly.

## Example In-Game Expression

- Tutorial round 1 shows simple word boundaries.
- Tutorial round 2 exposes that spaces can belong to following tokens.
- Later rounds with URLs or filenames remove target hints and force inference.

## Playtest Questions

- Does the player improve after seeing a missed boundary review?
- Does the player understand that tokens are not words?
- Does the tutorial avoid teaching a false rule such as "cut every space"?
