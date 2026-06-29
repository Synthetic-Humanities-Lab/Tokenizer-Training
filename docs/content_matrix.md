# Content Matrix

Difficulty increases through tokenization complexity.

## Tier 1: Simple Prose

- short common words
- ordinary spacing
- minimal punctuation

Examples:
- the cat sat on the mat
- how many dogs are there
- a small prompt arrives
- write a short reply
- tokens hide in plain sight
- review the token ledger
- pay cost and balance

## Tier 2: Common Irregularities

- contractions
- apostrophes
- hyphenation
- numbers
- punctuation

Examples:
- I can't believe it.
- re-enter the room
- it costs $19.99
- wait... what?
- don't split that yet
- hello, tokenizer.
- budget=$42
- worker-id2040
- ok/no?

## Tier 3: Dense Strings

- URLs
- emails
- filenames
- hashtags
- camelCase
- snake_case

Examples:
- openai.com/pricing
- admin@example.com
- hello_world_v2.py
- parseJSONQuickly()
- #GameDev2026
- docs.example.org/api
- invoice.final.04.csv
- getUserID42()
- billing.ai/report
- root@localhost.dev
- audit.log.2026.txt
- setTokenLimit(8192)

## Tier 4: Chaotic Strings

- emoji
- multilingual strings
- symbol clusters
- code snippets
- weird proper nouns
- internet slang

Examples:
- café mañana
- naïve façade
- Model A-12
- cost_per_token++
- model_name=cl100k_base
- lol!!! why tho
- rate_limit=429
- queue→worker
- über token
- rank→cost
- assistant_v4=stale
- ` audit queue`

## Selection Rules

- Avoid immediate repeats.
- Rotate categories.
- Increase tier availability over time.
- Harder examples should offer higher pay but higher risk.

## Current Fixture Coverage

The checked-in corpus currently contains 78 `cl100k_base` fixtures:

- Tier 1: 16 simple prose examples, including economy, labor, and review phrases
- Tier 2: 24 punctuation, contraction, hyphenation, number, currency, ID, and symbol examples
- Tier 3: 19 dense URL, email, filename, command, code, and hashtag examples
- Tier 4: 19 multilingual, leading-space, tokenizer-string, symbolic, and code-symbol examples

All playable fixtures are generated from `data/seed_strings.csv` and rejected if
token byte boundaries cannot map cleanly to visible grapheme boundaries.
