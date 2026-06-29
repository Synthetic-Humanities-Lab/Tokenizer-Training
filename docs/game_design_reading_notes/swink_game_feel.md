# Steve Swink - Game Feel

Source PDF: `../Game Design Reading and Principles/Swink Game Feel.pdf`

## Synoptic Note

Swink's central value for this project is that even abstract educational games
need embodied feedback. Token boundary prediction happens in the head, but the
game is played by a hand dragging across text. If the cut gesture feels vague,
late, visually ambiguous, or disconnected from scoring, the lesson becomes
suspect. Game feel here means real-time control over a symbolic object: the
player should feel that they are making precise incisions in text, not clicking
through a worksheet.

## Introduction

The book argues for treating feel as design material. For Tokenizer Training,
the swipe is not secondary polish. It is the player's only expressive verb.

Implementation consequence: prioritize swipe trail, snap markers, immediate
audio, and visible resolution states before adding more content categories.

## Chapter 1 - Defining Game Feel

Game feel depends on real-time control, simulated context, and polish. A game can
have simple rules and still feel deep if response and feedback are tuned.

Implementation consequence: cutting boundaries should produce immediate,
persistent, and readable feedback. The text panel is the simulated space.

## Chapter 2 - Game Feel and Human Perception

Perception imposes timing thresholds. Delayed or inconsistent response breaks
the player's belief that input caused the result.

Implementation consequence: cut registration should happen during the gesture,
not only after pointer release. Audio and marker appearance should be near
instantaneous.

## Chapter 3 - The Game Feel Model of Interactivity

The player forms intent, the computer simulates state, and the senses receive
evidence. Feel emerges from the full loop, not from one animation.

Implementation consequence: input, scoring, marker rendering, timer pressure,
and feedback copy must agree about the current state.

## Chapter 4 - Mechanics of Game Feel

Mechanics are small units of feel. Their quality depends on how legible and
repeatable their input-response relationship is.

Implementation consequence: boundary slots should snap predictably and avoid
duplicate confusing space cuts.

## Chapter 5 - Beyond Intuition: Metrics for Game Feel

Feel can be measured with hard and soft metrics: timing, sensitivity, response
curves, clarity, and player report.

Implementation consequence: playtests should record misregistered cuts,
hesitation before resolution, accidental false cuts, and whether players trust
the snap positions.

## Chapter 6 - Input Metrics

Input quality depends on granularity, physical device, and gesture vocabulary.

Implementation consequence: mouse and touch should share the same boundary
logic. Mobile tests need special attention because finger occlusion can hide
small gaps.

## Chapter 7 - Response Metrics

Responses have attack, sustain, decay, and release qualities. A response can be
fast but still unreadable if it vanishes too quickly.

Implementation consequence: cut trails may decay quickly, but registered cut
markers must persist until resolution.

## Chapter 8 - Context Metrics

Context shapes the impression of speed, size, and relation. The playfield tells
the player how urgent and precise the action is.

Implementation consequence: the text panel should remain spatially stable enough
for comparison, even while the round timer and prompt-acquisition feedback create
pressure.

## Chapter 9 - Polish Metrics

Polish clarifies state changes through animation, sound, particles, and visual
emphasis. It should be informative, not ornamental.

Implementation consequence: correct, missed, and false cuts need different color
and label treatment because they teach different errors.

## Chapter 10 - Metaphor Metrics

Metaphor connects input to meaning. The cut metaphor must fit token boundaries
without implying that tokens are ordinary word breaks.

Implementation consequence: use bureaucratic segmentation language, not heroic
blade fantasy. The player is auditing text, not fighting it.

## Chapter 11 - Rules Metrics

Rules define what actions mean and how outcomes are valued.

Implementation consequence: the cost model should explain why missed boundaries,
false cuts, and token load have different economic effects.

## Chapter 12 - Asteroids

The case study shows how inertia, rotation, and projectile timing create a
coherent feel signature.

Implementation consequence: Tokenizer Training's equivalent signature is
precision under time pressure: a static text target, a decaying trail,
persistent cuts, and timed resolution.

## Chapter 13 - Super Mario Brothers

The case study shows depth inside simple controls through subtle response
curves, velocity, and affordances.

Implementation consequence: keep the control surface simple but make repeated
swipes reveal mastery: fewer false cuts, faster decisions, better dense-string
handling.

## Chapter 14 - Bionic Commando

The case study shows how constraint can create identity. Limited verbs can be
more expressive than many weak verbs.

Implementation consequence: do not add extra action verbs to compensate for
difficulty. Deepen swipe-cut resolution and feedback instead.

## Chapter 15 - Super Mario 64

The case study emphasizes camera, control states, and spatial readability in 3D.

Implementation consequence: for this 2D text game, the analogous risk is UI
camera clutter: HUD, overseer, feedback card, and token strip must not crowd the
text.

## Chapter 16 - Raptor Safari

The case study connects vehicle response, context, polish, metaphor, and rules
inside a specific playable fantasy.

Implementation consequence: the obsolete AI browser fantasy should be expressed
through controls, sound, economy, and feedback, not only menu copy.

## Chapter 17 - Principles of Game Feel

The chapter gathers principles such as predictable results, immediate response,
depth from simple control, novelty, appealing response, organic motion, harmony,
and ownership.

Implementation consequence: the player must feel accountable for cuts. If a
result surprises them, the review state must show why.

## Chapter 18 - Games I Want to Make

The chapter treats game feel as an engine for new forms of play, including
embodied or intimate control metaphors.

Implementation consequence: text segmentation can be playful if the hand learns
computational structure through repeated tactile correction.

## Chapter 19 - The Future of Game Feel

The future-facing discussion keeps feel tied to evolving input, response,
context, polish, metaphor, and rules.

Implementation consequence: the web build should remain device-flexible and
responsive rather than tuned only for a desktop mouse.
