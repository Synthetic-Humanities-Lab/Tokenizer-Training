# Tokenizer Training Design Spec

## Overview

Visible hierarchy: Tokenizer Training as the product, WienerWorks as the company, Human Segmentation Division as the internal department
Genre: Educational arcade microgame
Target: Browser-first mobile game
Primary reference: Fruit Ninja meets WarioWare, filtered through polished AI-product bureaucracy.

The player slices text where token boundaries will occur. The system reveals real tokenization, scores the player, applies Token Credit/rework consequences, and moves immediately to the next round.

## Game States

1. Boot
2. Main Menu
3. Tutorial
4. Training
5. Results / Termination

## Tutorial

The tutorial should be slow, guided, and explicit. It should teach:

1. Words and spaces can create boundaries.
2. Punctuation and contractions complicate boundaries.
3. Dense strings like URLs, emails, code, and filenames can fragment.
4. Incorrect segmentation creates rework and spends Token Credits.

Tutorial feedback should pause long enough to read.

## Training

Training is the core player-facing mode. It is uncapped while Token Credits
remain and ends when the account reaches zero. The internal mode/route name is `endless`;
it may remain in source and operational evidence, but it is not player-facing
copy.

- Session starts with 40 Token Credits (`TC`).
- Every exact resolved tokenizer token earns 1 TC.
- A missed boundary invalidates the two tokens it joins.
- A false cut invalidates the token it splits and adds one false-fragment rework unit.
- Rework is weighted by fixture difficulty and the progression penalty scale.
- Verified credits minus rework updates the account after each Training round.
- Session ends when Token Credits reach zero.
- High score and best rank are stored locally.

## Difficulty

Difficulty increases through:

- reduced time window
- higher tier text categories
- denser boundary patterns
- larger economic penalties
- increasingly strange strings

Difficulty should come from tokenization complexity, not arbitrary enemies or unrelated mechanics.

## Input

Use pointer input that works for mouse and touch.

The player should swipe through the text. Every displayed guide must accept a cut. A visible space run is represented by one centered guide, never separate cuts on both sides; all other displayed slots remain independently selectable. Scoring determines whether a staged cut is correct.

## Feedback

Each round should show:

- correct cuts
- missed boundaries
- false cuts
- final token count
- verified Token Credits
- rework Token Credits
- net credit change
- one short overseer line

Feedback should be fast but readable.

## Economy

Current rule:

- verified credits equal the number of exact surviving tokenizer tokens
- rework units equal invalidated true tokens plus false cuts
- `rework = ceil(rework units * difficulty weight * penalty scale)`
- `net = verified credits - rework`
- Token Credits reaching zero ends the session

## Rank System

Use eleven comic bureaucratic titles based only on completed rounds. Accuracy,
remaining credits, and verified-to-rework efficiency remain session evidence;
they do not alter rank.

Ranks:
- 0: Regex Intern
- 10: Junior Boundary Clerk
- 20: Prompt Intake Associate
- 30: Token Ledger Coordinator
- 40: Whitespace Compliance Officer
- 50: Merge Table Liaison
- 70: Vocabulary Registry Officer
- 90: Senior Sequence Administrator
- 110: Acting Automation Supervisor
- 130: Interim Replacement Director
- 200: Artificial Intelligence

## Non-Goals for This Phase

Do not build:
- multiple game modes
- native mobile app wrapper
- voice acting
- leaderboard backend
- user-generated prompts
- alternate tokenizer comparison mode
- fake generated answer stage

Focus on the polished vertical slice.
