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
- internet punctuation clusters

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
- okayyyy!!!
- wait--what?!

## Tier 3: Dense Strings

- URLs
- emails
- filenames
- hashtags
- camelCase
- snake_case
- shell commands

Examples:
- wiener.ai/pricing
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
- git status --short
- chmod +x deploy.sh

## Tier 4: Chaotic Strings

- multilingual strings
- symbol clusters
- code snippets
- proper names
- leading and ordinary spaces

Examples:
- café mañana
- naïve façade
- Model A-12
- cost_per_token++
- model_name=bun40_base
- lol!!! why tho
- rate_limit=429
- queue→worker
- über token
- rank→cost
- assistant_v4=stale
- ` audit queue`
- WienerWorks HQ
- tokenización manual
- ` human tokenizer`

## Selection Rules

- Retire correctly completed sentences for the run.
- Retry failed sentences only after twenty intervening prompts.
- Rotate categories.
- Increase tier availability over time.
- Harder examples should offer higher pay but higher risk.

## Current Fixture Coverage

The checked-in corpus currently contains 200 `cl100k_base` fixtures. The Token Log
uses this as its completion quota:

- 60 ordinary prose examples (30%), including future labor, WienerWorks, office, and absurd prompt language
- 60 punctuation, number, contraction, hyphenation, and informal-language examples (30%)
- 40 URL, email, filename, command, code, hashtag, and technical-string examples (20%)
- 40 Latin-script multilingual, spacing, leading-space, proper-name, and symbolic edge cases (20%)

The difficulty distribution is Tier 1: 40, Tier 2: 50, Tier 3: 50, and Tier 4: 60.

All playable fixtures are generated from `data/seed_strings.csv` and rejected if
token byte boundaries cannot map cleanly to visible grapheme boundaries.
Player-facing model and company names in the corpus are fictionalized; the
fixture generator still uses real `cl100k_base` encoding so every boundary and
vocabulary ID remains factual.
