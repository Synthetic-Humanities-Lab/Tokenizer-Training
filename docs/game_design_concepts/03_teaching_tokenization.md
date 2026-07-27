# Concept 03 - Teaching Tokenization

Draws on: Zubek player experience and gameplay loops; Isbister agency;
Flanagan language games.

## Design Claim

The game teaches by making ordinary reading unreliable. The player learns to
shift from words and meaning to tokenizer-visible structure: leading spaces,
punctuation, dense strings, and byte-safe grapheme boundaries.

## Implementation Guidance

- Establish the fiction before terminology: the player is a new human hire,
  Wiener is the supervising AI, and compute cost has pushed tokenization back
  into manual labour.
- Explain the actual pipeline in progressive disclosure: text is divided into
  reusable chunks before model processing; those chunks come from a fixed
  learned vocabulary; every complete token maps to an integer ID.
- Start with worked examples where target hints are visible.
- Remove explicit answers after the early tutorial.
- Use the intake for the conceptual model, then teach swipe/Resolve, review
  labels and ledger consequences, vocabulary IDs, and Clear through worked play.
- Introduce leading spaces before removing target hints; the first unguided
  token-not-word lesson must use a fixture that visibly splits within a readable
  expression rather than a fully word-aligned sentence.
- Keep IDs hidden during prediction. Show an ID on a falling piece only when the
  player's submitted piece exactly reconstructs a real token.
- Keep feedback short and diagnostic: name the tokenization mistake first.
- Restrict playable fixtures to safe grapheme-aligned boundaries until the
  runtime can display unsafe cases honestly.

## Example In-Game Expression

- Orientation moves from employment premise to tokenizer model to controls.
- Tutorial round 1 establishes controls, review labels, and ledger consequences.
- Tutorial round 2 connects complete falling tokens to real vocabulary IDs.
- Tutorial round 4 exposes that spaces can belong to following tokens.
- Tutorial round 5 uses `re-enter` to demonstrate that a readable expression can
  contain multiple learned chunks.
- Later rounds with URLs or filenames remove target hints and force inference.

## Playtest Questions

- Does the player improve after seeing a missed boundary review?
- Does the player understand that tokens are not words?
- Can the player explain that token IDs identify vocabulary entries rather than
  score, meaning, or rarity?
- Does the tutorial avoid teaching a false rule such as "cut every space"?
