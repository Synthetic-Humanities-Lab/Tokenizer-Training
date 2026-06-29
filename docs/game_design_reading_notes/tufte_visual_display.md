# Edward Tufte - The Visual Display of Quantitative Information

Source PDF: `../Game Design Reading and Principles/Tufte, The Visual Display of Quantitative Information.pdf`

## Synoptic Note

Tufte gives this project a standard for making score, cost, time, and token
evidence visible without smothering the playfield. The game is about learning a
hidden structure, so the interface must reveal data with precision. A funny
corporate skin is useful only if it keeps the evidence legible. The HUD should
favor comparison, density, and immediate diagnosis over decorative chrome.

## Chapter 1 - Graphical Excellence

Good displays communicate complex information clearly and efficiently. They show
the data, encourage comparison, and integrate visual, verbal, and numerical
evidence.

Implementation consequence: the review state should put correct, missed, false,
token count, pay, cost, and net into one inspectable arrangement.

## Chapter 2 - Graphical Integrity

Displays should not distort quantities, hide baselines, or exaggerate change.
Visual encodings must respect the underlying data.

Implementation consequence: timer bars, balance labels, and cost colors should
not imply a different scale than the numbers. Cost and pay should remain
arithmetically transparent.

## Chapter 3 - Sources of Graphical Integrity and Sophistication

Sophisticated displays come from respect for evidence, context, and reasoning.
The viewer should be led toward the substance.

Implementation consequence: if visual flair competes with boundary evidence, it
is a regression. The game can be ugly in-character while still being precise.

## Chapter 4 - Data-Ink and Graphical Redesign

Useful marks should carry information. Redesign removes redundant ink and makes
the structure of the data more visible.

Implementation consequence: HUD chrome should be restrained. The marks that
matter most are timer, cuts, token strip, audit counts, and balance.

## Chapter 5 - Chartjunk: Vibrations, Grids, and Ducks

Decorative noise can distract from evidence and make quantitative judgment
worse.

Implementation consequence: the degraded enterprise aesthetic must remain
functional. Background grids and bureaucratic panels should stay low-contrast
and never obscure text boundaries.

## Chapter 6 - Data-Ink Maximization and Graphical Design

Maximizing useful marks is an editing discipline, not a demand for minimalism.

Implementation consequence: visual density is allowed when every item helps
the player compare action to truth. Labels that merely repeat obvious state
should be removed or compacted.

## Chapter 7 - Multifunctioning Graphical Elements

The best marks can carry multiple kinds of evidence at once.

Implementation consequence: a resolved cut marker can encode position, error
class, and review sequence through x-position, color, and label.

## Chapter 8 - Data Density and Small Multiples

Dense displays can be clear when organized for comparison and repeated reading.

Implementation consequence: later playtest builds can use compact session
summaries or small-multiple mistake patterns, but the live play surface should
not sacrifice the text panel.

## Chapter 9 - Aesthetics and Technique in Data Graphical Design

Craft, proportion, typography, and editing support reasoning. Beauty is not
separate from comprehension.

Implementation consequence: "worn enterprise software" should have disciplined
spacing, stable panels, and readable type. Sloppiness is not an aesthetic.

## Epilogue - Designs for the Display of Information

The epilogue reinforces design as the presentation of evidence for thought.

Implementation consequence: the final playtest question is not whether the HUD
looks full, but whether players can explain their mistakes after seeing it.
