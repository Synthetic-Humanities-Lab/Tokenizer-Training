# Tokenizer Fixture Pipeline

Fixtures are generated at build time from `data/seed_strings.csv` using one tokenizer: `cl100k_base`.

## Boundary Model

Real tokenizers operate on byte sequences. The game asks the player to cut visible text, so the generator maps token byte boundaries onto display grapheme boundaries before a fixture is allowed into runtime data.

The generator rejects a seed when:
- token bytes fail to reconstruct the original UTF-8 input
- a token boundary falls inside a grapheme cluster
- an individual token byte span cannot be decoded as standalone UTF-8 after boundary validation
- a boundary follows a visible space and would create a confusing post-space cut
- boundaries create duplicate cuts around an ordinary visible space

## Fixture Shape

Runtime fixtures include token IDs, token strings, token byte spans, display graphemes, grapheme byte spans, grapheme-index boundary positions, and byte boundary positions. `boundary_positions` are grapheme indexes, not JavaScript code-unit indexes.

`scripts/generate-token-fixtures.ts` owns tokenizer access. Runtime systems consume checked-in JSON from `src/game/data/fixtures.json`.
