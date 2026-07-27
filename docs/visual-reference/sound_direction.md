# WienerWorks Sound Direction

## Cue List

- `cut`: one consistent, noise-led paper shear with a low mechanical snap. Broad
  swipes repeat the same material voice rather than climbing through pitches.
- `ui`: muted pill-button tap; short sine tone, low gain.
- `resolve`: gentle AI-card confirmation swell; short smooth tone with restrained gain.
- `good`: small ascending glassy chime; triangle/sine-like tone with upward pitch movement.
- `bad`: soft negative notification; low sine tone with downward pitch movement.
- `miss`: quiet boundary escape cue; low triangle tone, short and dry.
- `falseCut`: clipped audit tick; brief triangle tone, not a sword slash.
- `warning`: low modern attention pulse; sine tone, controlled and non-siren.

## Implementation Notes

Use filtered WebAudio noise plus restrained sine/triangle support when no audio
assets exist. Route the paper noise and tonal snap through separate filters so
the slice reads as material contact rather than a tiny melody. Avoid square and
sawtooth oscillators because they read as Pong, arcade, or retro terminal
feedback.

Keep all cue durations under the immediate feedback window. Resolution stacks should remain staggered, subtle, and cancellable when the scene exits. Mute behavior and cue sequencing must remain unchanged.

## Test Expectations

Tests should verify:

- no cue uses square or sawtooth waveforms
- cut and UI cues remain brief and low gain
- multi-cut bursts repeat one cut voice with bounded spacing
- resolution cues remain distinct by pitch or waveform
- scheduled cue spacing still fits inside the immediate feedback window
- delayed cues can still be cancelled
