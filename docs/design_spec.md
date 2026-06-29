# Tokenization Training Design Spec

## Overview

Visible hierarchy: Tokenization Training as the product, WienerWorks as the company, Human Segmentation Division as the internal department  
Genre: Educational arcade microgame  
Target: Browser-first mobile game  
Primary reference: Fruit Ninja meets WarioWare, filtered through polished AI-product bureaucracy.

The player slices text where token boundaries will occur. The system reveals real tokenization, scores the player, applies wage/cost consequences, and moves immediately to the next round.

## Game States

1. Boot
2. Main Menu
3. Tutorial
4. Endless Training
5. Results / Termination

## Tutorial

The tutorial should be slow, guided, and explicit. It should teach:

1. Words and spaces can create boundaries.
2. Punctuation and contractions complicate boundaries.
3. Dense strings like URLs, emails, code, and filenames can fragment.
4. Incorrect segmentation has cost consequences.

Tutorial feedback should pause long enough to read.

## Endless Training

Endless Training is the core mode.

- Session starts with positive balance.
- Correct cuts earn pay.
- Missed boundaries and false cuts incur company cost.
- Net balance updates after each round.
- Session ends when balance reaches zero.
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

The player should swipe through the text. The game should register cuts at valid boundary slots between grapheme clusters, snapping to the nearest cut position when reasonable.

## Feedback

Each round should show:

- correct cuts
- missed boundaries
- false cuts
- final token count
- pay
- company cost
- net balance change
- one short overseer line

Feedback should be fast but readable.

## Economy

Suggested values can be tuned:

- base pay scales with tier
- correct cuts improve pay
- missed boundaries cost more than false cuts
- dense/high-token strings can increase cost
- balance reaching zero ends the session

## Rank System

Use comic pseudo-benchmarking based on score, accuracy, speed, and cost efficiency.

Possible ranks:
- Regex Intern
- Junior Boundary Clerk
- Prompt Intake Associate
- BPE Adjacent
- cl100k Probationary
- Economically Defensible Mammal
- Temporary Sequence Specialist

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
