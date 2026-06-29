# Tokenizer Spec

Use real tokenizer data, not the MVP approximation.

## Recommended Implementation

Use a build-time tokenizer fixture generator.

Pipeline:
1. Read data/seed_strings.csv.
2. Tokenize each string using a real tokenizer.
3. Generate src/game/data/fixtures.json.
4. Runtime game reads precomputed fixtures.

## Preferred Tokenizers

Start with one tokenizer only. Good first candidates:
- cl100k_base
- o200k_base

Do not mix tokenizers inside a run unless a later mode explicitly teaches tokenizer differences.

## Fixture Fields

Each fixture should include:

- id
- text
- category
- tier
- token_count
- token_ids
- token_strings
- token_byte_spans
- graphemes
- grapheme_byte_spans
- boundary_positions
- boundary_byte_positions
- difficulty_weight
- notes

## Unicode Warning

Real tokenizers may operate over byte sequences or token strings that do not trivially map to JavaScript character indices. Emoji, combined glyphs, accents, and mixed scripts need care.

For the first polished version, restrict the playable corpus to strings whose token boundaries map cleanly to visible grapheme boundaries. Candidate strings whose token byte boundaries land inside a grapheme cluster must be rejected at fixture-generation time.

Add tests that verify:
- token strings reconstruct the original input
- token byte spans reconstruct the original UTF-8 input
- boundary positions are sorted
- boundary positions are within valid grapheme ranges
- byte boundary positions map exactly to grapheme boundary positions
- each fixture has at least one playable boundary unless intentionally marked otherwise
