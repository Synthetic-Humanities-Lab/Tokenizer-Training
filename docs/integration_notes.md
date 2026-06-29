# Overseer Line Schema Migration Notes

## Intent

This migration deliberately breaks the old six-pool line schema and replaces it with a category-driven structure tied to scene, moment, delivery mode, and cooldown grouping.

The old schema was:

- `good`
- `missed`
- `falseCut`
- `overcut`
- `lowBalance`
- `bad`

That produced only nineteen total lines and depended on a single feedback-classification path. The new schema supports menu, tutorial, play-start, play-resolve, economy-warning, results, and system-fault contexts.

## New runtime shape

Recommended TypeScript shape:

```ts
export interface OverseerLinesV2 {
  schema_version: 2;
  persona: {
    id: string;
    display_name: string;
    company: string;
    surface: string;
    world_year: number;
    interface_era: number;
    description: string;
    selection_policy: {
      repeat_window: number;
      max_same_category_in_row: number;
      prefer_short_lines_during_active_play: boolean;
      suppress_nonessential_barks_during_swipe: boolean;
    };
  };
  categories: Record<string, OverseerCategory>;
}

export interface OverseerCategory {
  scene: "menu" | "tutorial" | "play" | "economy" | "results" | "system";
  delivery: "bubble" | "panel";
  target_length: "short" | "medium";
  cooldown_group: string;
  lines: string[];
}
Recommended new selector
Create a new OverseerLineSystem responsible for:

loading overseer_lines.json
selecting a category key from gameplay context
avoiding immediate repetition using a category+line history window
enforcing short lines for active play
exposing a single method such as:
ts
Copy
pick(category: string, seed?: number): string
and optionally:

ts
Copy
pickForContext(context: OverseerContext): string
Required code changes
FeedbackSystem.ts
Remove the direct import assumptions for good, missed, falseCut, overcut, lowBalance, and bad.
Keep classifyIssue() if useful for the technical line, but route overseer selection through OverseerLineSystem.
Map score outcomes to categories such as:
play.resolve.perfect
play.resolve.good
play.resolve.mixed
play.resolve.missed
play.resolve.false_cut
play.resolve.overcut
play.resolve.timeout
economy.balance_warning
SessionFlowSystem.ts
Replace activeTrainingLine() with category selection from:
play.round_start.neutral
play.round_start.low_balance
play.round_start.dense_string
Replace result-summary overseer copy with:
results.session_budget
results.session_quit
TutorialSystem.ts
Keep the expanded ten-round tutorial route, but simplify text plumbing only when it does not disturb cadence.
Replace the many inline popup fields with a smaller script surface:
pause_line
active_line
resolve_good
resolve_bad
Drive these from a content object or copy deck rather than hardcoding every line in the system class.
Keep byte/token-ID compatibility fields populated for now, but do not re-enable detached memo-card tutorial behavior.
TutorialCompleteContentSystem.ts
Replace pass/fail summary strings with the new copy deck values.
MenuContentSystem.ts
Replace the current premise/work-order copy with the menu stack and body copy from docs/copy_deck.md.
PlayScene.ts
Keep the current one-comment-on-prompt and one-comment-after-resolve cadence.
On round start, request:
play.round_start.low_balance if balance is low
else play.round_start.dense_string for dense fixture categories
else play.round_start.neutral
On resolve, request a category from the score outcome.
On timeout, request play.resolve.timeout.
On balance warning transition, request economy.balance_warning.
For missing copy lookups or restricted fixtures, request:
system.record_missing
system.fixture_restricted
Optional but recommended
Create a small CopyDeckSystem or content module so menu, tutorial, and result copy do not remain scattered across:

MenuContentSystem.ts
TutorialSystem.ts
TutorialCompleteContentSystem.ts
SessionFlowSystem.ts
This makes future tone passes much cheaper and keeps WIENER’s persona coherent across all surfaces.
