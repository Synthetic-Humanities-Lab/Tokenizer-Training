# Economy Tuning Audit

Status: locally bracketed, externally unproven.

This audit records the deterministic economy envelope used before real tester
sessions. It is not evidence that players understand the economy. It only proves
that the current scoring, fixture order, and difficulty ramp create a playable
pressure curve for representative strategies.

## Strategy Envelope

All scenarios start with the production endless balance of `$40.00`, use the
deterministic fixture picker with highest-tier preference, and apply the same
round penalty scale used by the game.

| Strategy | Local result | Design implication |
| --- | --- | --- |
| No play: make no cuts | Budget closes after onboarding, currently around round 5 | Inaction is punished, but the first few rounds remain observable for a confused tester. |
| Overcut: cut every legal slot | Budget closes faster than no-play, currently around round 4 | Guessing everywhere is framed as company cost, not as a viable brute-force tactic. |
| Half-complete: cut roughly half the true boundaries | Budget closes in the dense-string ramp, currently around round 12 | Partial competence survives long enough to see tier-three material, then becomes expensive. |
| Near-perfect: miss one true boundary per round | Budget reaches tier four and then closes, currently around round 17 | Small repeated mistakes are survivable but consequential. |
| Perfect: cut every true boundary | A 24-round sample remains solvent and reaches tier four | Mastery is rewarded; the game does not punish correct tokenization for drama. |

## Principle Check

- Top game design: the economy separates doing nothing, guessing everywhere,
  partial competence, near mastery, and mastery.
- Critical/conceptual play: false and missed boundaries become institutional
  cost, so the training fiction operates through rules instead of copy alone.
- Emotional design: recovery is possible round by round, but repeated small
  errors accumulate into a visible balance consequence.
- Game feel: the economy depends on the same boundary model as swipe scoring;
  the player is not judged by a hidden secondary target.
- Visual display: review feedback files pay, cost, net, token load, and balance
  in the same accounting vocabulary used by the result ledger.

## Remaining Proof

Real sessions still need to show whether testers can explain that pay minus
company cost produces net, that balance is the remaining session budget, and
that overcutting or missed cuts feel earned rather than arbitrary.
