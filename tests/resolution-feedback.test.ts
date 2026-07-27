import { describe, expect, it, vi } from "vitest";
import {
  AudioSystem,
  CUT_CONFIRMATION_CUE_SPACING_MS,
  MAX_CUT_CONFIRMATION_CUES,
  NATIVE_AUDIO_MESSAGE_HANDLER_NAME,
  audioCueShapes,
  cueEnvelope,
  cutConfirmationAudioCues,
  RESOLUTION_CUE_SPACING_MS,
  scheduleAudioCues
} from "../src/game/systems/AudioSystem";
import {
  COMPACT_RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y,
  COMPACT_RESOLUTION_LABEL_ROW_STEP,
  RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y,
  RESOLUTION_CROSS_KIND_LABEL_MIN_GAP,
  RESOLUTION_FULL_LABEL_LIMIT,
  RESOLUTION_LABEL_ROW_COUNT,
  RESOLUTION_LABEL_ROW_STEP,
  RESOLUTION_STAGGERED_LABEL_MIN_GAP_RATIO,
  ResolutionFeedbackSystem,
  resolutionAuditLegendItems,
  resolutionAuditLegendPromptOffsetY,
  resolutionAuditLegendText,
  resolutionCommitBeatLabel,
  resolutionCommitBeatStyle,
  resolutionCutLabelMinGap,
  resolutionCutLabelGroupsHaveRoom,
  resolutionCutLabelModeForGroups,
  resolutionCutLabelMode,
  resolutionCutLabelsHaveRoom,
  resolutionLabelOffset
} from "../src/game/systems/ResolutionFeedbackSystem";

describe("ResolutionFeedbackSystem", () => {
  it("plays one dominant positive judgement cue for clean rounds", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [],
      falseCuts: [],
      creditBalance: 40
    });

    expect(cues).toEqual(["good"]);
  });

  it("collapses mixed cut errors into one dominant negative judgement cue", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [3],
      falseCuts: [5],
      creditBalance: 40
    });

    expect(cues).toEqual(["bad"]);
  });

  it("adds at most one low-balance warning after the judgement cue", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [],
      falseCuts: [5],
      creditBalance: 9
    });

    expect(cues).toEqual(["bad", "warning"]);
  });

  it("maps resolved outcomes to one tactile cue so touch commits feel consequential", () => {
    const system = new ResolutionFeedbackSystem();

    expect(system.hapticCue({
      missedCuts: [],
      falseCuts: [],
      creditBalance: 40
    })).toBe("confirm");
    expect(system.hapticCue({
      missedCuts: [3],
      falseCuts: [],
      creditBalance: 40
    })).toBe("miss");
    expect(system.hapticCue({
      missedCuts: [],
      falseCuts: [5],
      creditBalance: 40
    })).toBe("miss");
    expect(system.hapticCue({
      missedCuts: [3],
      falseCuts: [5],
      creditBalance: 9
    })).toBe("warning");
  });

  it("plans brief commit beats for submitted and empty resolves", () => {
    const emptyStyle = resolutionCommitBeatStyle(0);
    const style = resolutionCommitBeatStyle(3);
    const compactStyle = resolutionCommitBeatStyle(3, true);
    const denseStyle = resolutionCommitBeatStyle(99);
    const deadlineEmptyStyle = resolutionCommitBeatStyle(0, false, "deadline");
    const deadlineStyle = resolutionCommitBeatStyle(3, false, "deadline");

    expect(emptyStyle).not.toBeNull();
    expect(style).not.toBeNull();
    expect(compactStyle).not.toBeNull();
    expect(denseStyle).not.toBeNull();
    expect(deadlineEmptyStyle).not.toBeNull();
    expect(deadlineStyle).not.toBeNull();
    expect(emptyStyle!.durationMs).toBeLessThan(style!.durationMs);
    expect(emptyStyle!.bandAlpha).toBeLessThan(style!.bandAlpha);
    expect(emptyStyle!.haloAlpha).toBeLessThan(style!.haloAlpha);
    expect(emptyStyle!.lineAlpha).toBeGreaterThan(0);
    expect(style!.durationMs).toBeGreaterThanOrEqual(180);
    expect(style!.durationMs).toBeLessThanOrEqual(260);
    expect(style!.bandAlpha).toBeGreaterThan(0);
    expect(style!.bandAlpha).toBeLessThanOrEqual(0.2);
    expect(style!.haloWidth).toBeGreaterThan(style!.lineWidth);
    expect(compactStyle!.durationMs).toBeLessThan(style!.durationMs);
    expect(compactStyle!.bandPaddingX).toBeLessThan(style!.bandPaddingX);
    expect(denseStyle!.bandAlpha).toBeLessThanOrEqual(0.2);
    expect(deadlineEmptyStyle!.durationMs).toBeGreaterThan(emptyStyle!.durationMs);
    expect(deadlineEmptyStyle!.lineAlpha).toBeGreaterThan(emptyStyle!.lineAlpha);
    expect(deadlineStyle!.durationMs).toBeGreaterThan(style!.durationMs);
    expect(deadlineStyle!.haloAlpha).toBeGreaterThan(style!.haloAlpha);
    expect(deadlineStyle!.bandAlpha).toBeGreaterThan(style!.bandAlpha);
    expect(deadlineStyle!.bandAlpha).toBeLessThanOrEqual(0.22);
  });

  it("names the submitted cut set at manual and deadline commit time", () => {
    expect(resolutionCommitBeatLabel(3)).toBe("COMMIT 3");
    expect(resolutionCommitBeatLabel(0)).toBe("NO CUTS");
    expect(resolutionCommitBeatLabel(2.9, "manual")).toBe("COMMIT 2");
    expect(resolutionCommitBeatLabel(4, "deadline")).toBe("DEADLINE 4");
    expect(resolutionCommitBeatLabel(Number.NaN, "deadline")).toBe("TIMEOUT");
  });

  it("keeps cue voices bounded and materially distinct", () => {
    const cues = ["cut", "good", "bad", "warning"] as const;
    const signatures = new Set(cues.map((cue) => {
      const shape = audioCueShapes[cue];
      return `${shape.frequency}:${shape.endFrequency ?? "hold"}:${shape.type}`;
    }));

    for (const cue of cues) {
      expect(audioCueShapes[cue].durationMs).toBeLessThanOrEqual(250);
      expect(["sine", "triangle"]).toContain(audioCueShapes[cue].type);
      expect(["paper", "relay"]).toContain(audioCueShapes[cue].material);
      expect(audioCueShapes[cue].noiseGain).toBeGreaterThan(0);
      expect(audioCueShapes[cue].filterFrequency).toBeGreaterThanOrEqual(300);
    }
    expect(signatures.size).toBe(cues.length);
  });

  it("bounds oscillator and noise envelopes before scheduling WebAudio voices", () => {
    const cutEnvelope = cueEnvelope(audioCueShapes.cut);
    const warningEnvelope = cueEnvelope(audioCueShapes.warning);

    expect(cutEnvelope).toMatchObject({
      durationSeconds: 0.058,
      attackSeconds: 0.002,
      noiseDurationSeconds: 0.026,
      oscillatorGain: 0.0065,
      noiseGain: 0.012
    });
    expect(cutEnvelope.noiseGain).toBeGreaterThan(cutEnvelope.oscillatorGain);
    expect(warningEnvelope.durationSeconds).toBeLessThanOrEqual(0.25);
    expect(warningEnvelope.attackSeconds).toBeGreaterThanOrEqual(0.002);
    expect(warningEnvelope.noiseDurationSeconds).toBeLessThanOrEqual(warningEnvelope.durationSeconds);
    expect(warningEnvelope.oscillatorGain).toBeLessThanOrEqual(0.03);
    expect(warningEnvelope.noiseGain).toBeLessThanOrEqual(0.012);
  });

  it("keeps cut and UI interface sounds soft and brief", () => {
    expect(audioCueShapes.cut.durationMs).toBeLessThanOrEqual(60);
    expect(audioCueShapes.clear.durationMs).toBeLessThanOrEqual(110);
    expect(audioCueShapes.ui.durationMs).toBeLessThanOrEqual(60);
    expect(["sine", "triangle"]).toContain(audioCueShapes.cut.type);
    expect(["sine", "triangle"]).toContain(audioCueShapes.clear.type);
    expect(["sine", "triangle"]).toContain(audioCueShapes.ui.type);
    expect(audioCueShapes.cut.type).not.toBe("square");
    expect(audioCueShapes.clear.type).not.toBe("square");
    expect(audioCueShapes.ui.type).not.toBe("square");
    expect(audioCueShapes.cut.gain).toBeLessThan(0.03);
    expect(audioCueShapes.clear.gain).toBeLessThan(0.03);
    expect(audioCueShapes.ui.gain).toBeLessThan(0.03);
    expect(audioCueShapes.clear.frequency).toBeGreaterThan(audioCueShapes.clear.endFrequency ?? 0);
    expect(audioCueShapes.clear.frequency).not.toBe(audioCueShapes.ui.frequency);
  });

  it("uses one consistent shear voice for fast multi-cut confirmation bursts", () => {
    expect(MAX_CUT_CONFIRMATION_CUES).toBe(4);
    expect(CUT_CONFIRMATION_CUE_SPACING_MS).toBeGreaterThanOrEqual(20);
    expect(CUT_CONFIRMATION_CUE_SPACING_MS).toBeLessThanOrEqual(30);
    expect(cutConfirmationAudioCues(0)).toEqual([]);
    expect(cutConfirmationAudioCues(1)).toEqual(["cut"]);
    expect(cutConfirmationAudioCues(3)).toEqual(["cut", "cut", "cut"]);
    expect(cutConfirmationAudioCues(99)).toEqual(["cut", "cut", "cut", "cut"]);

    const scheduled = scheduleAudioCues(cutConfirmationAudioCues(4), CUT_CONFIRMATION_CUE_SPACING_MS);
    expect(scheduled.map((cue) => cue.delayMs)).toEqual([0, 28, 56, 84]);
    expect(Math.max(...scheduled.map((cue) => cue.delayMs))).toBeLessThanOrEqual(84);
  });

  it("schedules a judgement plus optional warning inside the immediate feedback window", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [3],
      falseCuts: [5],
      creditBalance: 8
    });
    const scheduled = scheduleAudioCues(cues);

    expect(cues).toEqual(["bad", "warning"]);
    expect(RESOLUTION_CUE_SPACING_MS).toBeGreaterThan(0);
    expect(new Set(scheduled.map((cue) => cue.delayMs)).size).toBe(cues.length);
    expect(Math.max(...scheduled.map((cue) => cue.delayMs))).toBeLessThanOrEqual(RESOLUTION_CUE_SPACING_MS);
  });

  it("can cancel delayed resolution cues when the scene exits", () => {
    vi.useFakeTimers();
    try {
      const audio = new AudioSystem();

      audio.playSequence(["bad", "warning"]);
      expect(vi.getTimerCount()).toBe(1);

      audio.cancelPending();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not create a browser audio context until an unmuted cue is explicitly played", () => {
    let createdContexts = 0;
    class FakeAudioContext {
      currentTime = 0;
      sampleRate = 48000;
      destination = {};
      state: AudioContextState = "running";

      constructor() {
        createdContexts += 1;
      }

      resume(): Promise<void> {
        return Promise.resolve();
      }

      createOscillator(): OscillatorNode {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        } as unknown as OscillatorNode;
      }

      createGain(): GainNode {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        } as unknown as GainNode;
      }

      createBiquadFilter(): BiquadFilterNode {
        return {
          type: "lowpass",
          frequency: { setValueAtTime: vi.fn() },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        } as unknown as BiquadFilterNode;
      }

      createBuffer(_channels: number, length: number): AudioBuffer {
        return {
          getChannelData: () => new Float32Array(length)
        } as unknown as AudioBuffer;
      }

      createBufferSource(): AudioBufferSourceNode {
        return {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        } as unknown as AudioBufferSourceNode;
      }
    }

    vi.stubGlobal("AudioContext", FakeAudioContext);
    try {
      const audio = new AudioSystem();
      const mutedAudio = new AudioSystem(true);

      expect(createdContexts).toBe(0);
      mutedAudio.play("ui");
      expect(createdContexts).toBe(0);
      audio.play("ui");
      expect(createdContexts).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("prefers the finite native audio bridge in the iOS shell and preserves mute gating", () => {
    let createdContexts = 0;
    const postMessage = vi.fn();

    class CountingAudioContext {
      constructor() {
        createdContexts += 1;
      }
    }

    vi.stubGlobal("webkit", {
      messageHandlers: {
        [NATIVE_AUDIO_MESSAGE_HANDLER_NAME]: { postMessage }
      }
    });
    vi.stubGlobal("AudioContext", CountingAudioContext);
    try {
      new AudioSystem().play("cut");
      new AudioSystem(true).play("ui");

      expect(postMessage).toHaveBeenCalledOnce();
      expect(postMessage).toHaveBeenCalledWith({ cue: "cut" });
      expect(createdContexts).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("waits for a suspended audio context to resume before emitting the cue", async () => {
    let resolveResume: (() => void) | undefined;
    const oscillatorStart = vi.fn();

    class SuspendedAudioContext {
      currentTime = 0;
      sampleRate = 48000;
      destination = {};
      state: AudioContextState = "suspended";

      resume(): Promise<void> {
        return new Promise((resolve) => {
          resolveResume = () => {
            this.state = "running";
            resolve();
          };
        });
      }

      createOscillator(): OscillatorNode {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn(),
          start: oscillatorStart,
          stop: vi.fn()
        } as unknown as OscillatorNode;
      }

      createGain(): GainNode {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        } as unknown as GainNode;
      }

      createBiquadFilter(): BiquadFilterNode {
        return {
          type: "lowpass",
          frequency: { setValueAtTime: vi.fn() },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        } as unknown as BiquadFilterNode;
      }

      createBuffer(_channels: number, length: number): AudioBuffer {
        return {
          getChannelData: () => new Float32Array(length)
        } as unknown as AudioBuffer;
      }

      createBufferSource(): AudioBufferSourceNode {
        return {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        } as unknown as AudioBufferSourceNode;
      }
    }

    vi.stubGlobal("AudioContext", SuspendedAudioContext);
    try {
      new AudioSystem().play("cut");

      expect(oscillatorStart).not.toHaveBeenCalled();
      resolveResume?.();
      await Promise.resolve();

      expect(oscillatorStart).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("fails soft when an embedded WebAudio context lacks a required voice node", () => {
    class IncompleteAudioContext {
      currentTime = 0;
      destination = {};
      state: AudioContextState = "running";
    }

    vi.stubGlobal("AudioContext", IncompleteAudioContext);
    try {
      expect(() => new AudioSystem().play("good")).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("defines distinct visual categories inside the immediate feedback window", () => {
    const groups = new ResolutionFeedbackSystem().visualCutGroups({
      correctCuts: [3],
      missedCuts: [7],
      falseCuts: [5]
    });
    const labels = new Set(groups.map((group) => group.label));
    const colors = new Set(groups.map((group) => group.color));
    const labelRows = new Set(groups.map((group) => group.labelOffsetY));
    const revealDelays = new Set(groups.map((group) => group.revealDelayMs));

    expect(groups.map((group) => group.kind)).toEqual(["correct", "false", "missed"]);
    expect(groups.map((group) => group.revealDelayMs)).toEqual([0, 80, 160]);
    expect(groups.map((group) => group.labelOffsetY)).toEqual([18, 44, 70]);
    expect(groups[1].labelOffsetY - groups[0].labelOffsetY).toBeGreaterThanOrEqual(24);
    expect(groups[2].labelOffsetY - groups[1].labelOffsetY).toBeGreaterThanOrEqual(24);
    expect(labels.size).toBe(3);
    expect(colors.size).toBe(3);
    expect(labelRows.size).toBe(3);
    expect(revealDelays.size).toBe(3);
    for (const group of groups) {
      expect(group.cuts.length).toBeGreaterThan(0);
      expect(group.labelOffsetY).toBeGreaterThan(0);
      expect(group.revealDelayMs).toBeLessThanOrEqual(250);
      expect(group.flashDurationMs).toBeLessThanOrEqual(250);
    }
    expect(groups.find((group) => group.kind === "correct")?.flash).toBe(true);
    expect(groups.find((group) => group.kind === "false")?.flash).toBe(false);
    expect(groups.find((group) => group.kind === "missed")?.flash).toBe(false);
  });

  it("staggers repeated resolution labels within a visual category", () => {
    expect(RESOLUTION_LABEL_ROW_COUNT).toBe(2);
    expect(RESOLUTION_LABEL_ROW_STEP).toBeGreaterThan(0);
    expect(COMPACT_RESOLUTION_LABEL_ROW_STEP).toBeLessThan(RESOLUTION_LABEL_ROW_STEP);
    expect(resolutionLabelOffset(44, 0)).toBe(44);
    expect(resolutionLabelOffset(44, 1)).toBe(56);
    expect(resolutionLabelOffset(44, 2)).toBe(44);
    expect(resolutionLabelOffset(44, -1)).toBe(44);
    expect(resolutionLabelOffset(44, 1.9)).toBe(56);
  });

  it("pulls compact review labels closer to markers so speech does not cover short-phone misses", () => {
    expect(resolutionLabelOffset(18, 0, true)).toBe(18);
    expect(resolutionLabelOffset(44, 0, true)).toBe(26);
    expect(resolutionLabelOffset(44, 1, true)).toBe(34);
    expect(resolutionLabelOffset(70, 0, true)).toBe(34);
    expect(resolutionLabelOffset(70, 1, true)).toBe(42);
    expect(resolutionLabelOffset(70, 1, true)).toBeLessThan(resolutionLabelOffset(70, 1));
  });

  it("keeps all resolution labels only when the review markers have room", () => {
    expect(RESOLUTION_FULL_LABEL_LIMIT).toBeGreaterThan(4);
    expect(resolutionCutLabelsHaveRoom([100, 140, 190], 30)).toBe(true);
    expect(resolutionCutLabelsHaveRoom([100, 118, 190], 30)).toBe(false);
    expect(resolutionCutLabelsHaveRoom([100, 136, 172, 208, 244], 38)).toBe(true);
    expect(resolutionCutLabelMode({
      totalCutCount: 3,
      cutXs: [100, 140, 190],
      minGap: 30
    })).toBe("all");
  });

  it("uses label-width-aware review spacing so compact labels do not pile up", () => {
    expect(RESOLUTION_STAGGERED_LABEL_MIN_GAP_RATIO).toBeGreaterThanOrEqual(0.84);
    expect(resolutionCutLabelMinGap("OK")).toBe(34);
    expect(resolutionCutLabelMinGap("MISS")).toBe(44);
    expect(resolutionCutLabelMinGap("FALSE")).toBe(52);
    expect(resolutionCutLabelMinGap("FALSE", true)).toBeGreaterThan(resolutionCutLabelMinGap("FALSE"));
    expect(resolutionCutLabelMode({
      totalCutCount: 2,
      cutXs: [100, 132],
      minGap: resolutionCutLabelMinGap("OK")
    })).toBe("all");
    expect(resolutionCutLabelMode({
      totalCutCount: 2,
      cutXs: [100, 127],
      minGap: resolutionCutLabelMinGap("MISS")
    })).toBe("first-by-kind");
    expect(resolutionCutLabelMode({
      totalCutCount: 2,
      cutXs: [100, 141],
      minGap: resolutionCutLabelMinGap("FALSE", true)
    })).toBe("first-by-kind");
    expect(resolutionCutLabelMode({
      totalCutCount: 2,
      cutXs: [100, 142],
      minGap: resolutionCutLabelMinGap("FALSE")
    })).toBe("first-by-kind");
  });

  it("keeps full review labels only when each band and cross-kind positions have room", () => {
    expect(RESOLUTION_CROSS_KIND_LABEL_MIN_GAP).toBeGreaterThanOrEqual(30);
    expect(resolutionCutLabelGroupsHaveRoom([
      { cutXs: [110, 146], minGap: 30 },
      { cutXs: [180], minGap: 52 },
      { cutXs: [214, 250], minGap: 38 }
    ])).toBe(true);
    expect(resolutionCutLabelGroupsHaveRoom([
      { cutXs: [110, 146], minGap: 30 },
      { cutXs: [124], minGap: 52 },
      { cutXs: [206, 244], minGap: 38 }
    ])).toBe(false);
    expect(resolutionCutLabelGroupsHaveRoom([
      { cutXs: [110], minGap: 30 },
      { cutXs: [138], minGap: 52 }
    ])).toBe(false);
    expect(resolutionCutLabelModeForGroups({
      groups: [
        { cutXs: [110, 146], minGap: 30 },
        { cutXs: [180], minGap: 52 },
        { cutXs: [214, 250], minGap: 38 }
      ]
    })).toBe("all");
    expect(resolutionCutLabelModeForGroups({
      groups: [
        { cutXs: [110, 146], minGap: 30 },
        { cutXs: [124], minGap: 52 },
        { cutXs: [206, 244], minGap: 38 }
      ]
    })).toBe("first-by-kind");
  });

  it("falls back to first-label legends in dense or cramped resolution reviews", () => {
    expect(resolutionCutLabelMode({
      totalCutCount: RESOLUTION_FULL_LABEL_LIMIT + 1,
      cutXs: [100, 140, 180, 220, 260, 300, 340, 380, 420],
      minGap: 30
    })).toBe("first-by-kind");
    expect(resolutionCutLabelMode({
      totalCutCount: 3,
      cutXs: [100, 116, 190],
      minGap: 30
    })).toBe("first-by-kind");
    expect(resolutionCutLabelMode({
      totalCutCount: 0,
      cutXs: [],
      minGap: 30
    })).toBe("none");
    expect(resolutionCutLabelModeForGroups({
      groups: [
        { cutXs: [100, 118], minGap: 38 }
      ]
    })).toBe("first-by-kind");
    expect(resolutionCutLabelModeForGroups({
      groups: [
        { cutXs: [100, 132, 164, 196, 228, 260, 292, 324, 356], minGap: 38 }
      ]
    })).toBe("first-by-kind");
  });

  it("builds a compact color/count audit key when dense review labels are suppressed", () => {
    const groups = new ResolutionFeedbackSystem().visualCutGroups({
      correctCuts: [3, 7],
      falseCuts: [4],
      missedCuts: [9, 12, 14]
    });
    const items = resolutionAuditLegendItems(groups, "first-by-kind");
    const compactItems = resolutionAuditLegendItems(groups, "first-by-kind", true);

    expect(resolutionAuditLegendItems(groups, "all")).toEqual([]);
    expect(resolutionAuditLegendItems(groups, "none")).toEqual([]);
    expect(items.map((item) => [item.kind, item.label, item.count, item.text])).toEqual([
      ["correct", "OK", 2, "OK 2"],
      ["false", "FALSE", 1, "FALSE 1"],
      ["missed", "MISS", 3, "MISS 3"]
    ]);
    expect(compactItems.map((item) => item.text)).toEqual(["OK 2", "F 1", "M 3"]);
    expect(new Set(items.map((item) => item.color)).size).toBe(3);
    expect(resolutionAuditLegendText(items)).toBe("OK 2 / FALSE 1 / MISS 3");
  });

  it("keeps the compact audit key close to the prompt so review speech has a clear band", () => {
    expect(resolutionAuditLegendPromptOffsetY(false)).toBe(RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y);
    expect(resolutionAuditLegendPromptOffsetY(true)).toBe(COMPACT_RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y);
    expect(resolutionAuditLegendPromptOffsetY(false)).toBeGreaterThanOrEqual(24);
    expect(resolutionAuditLegendPromptOffsetY(false)).toBeLessThanOrEqual(28);
    expect(resolutionAuditLegendPromptOffsetY(true)).toBeGreaterThanOrEqual(24);
    expect(resolutionAuditLegendPromptOffsetY(true)).toBeLessThanOrEqual(30);
  });

  it("keeps simple clean endless reviews fast", () => {
    const delay = new ResolutionFeedbackSystem().reviewAdvanceDelayMs({
      tutorialMode: false,
      category: "simple",
      textLength: 12,
      tokenCount: 4,
      missedCuts: [],
      falseCuts: []
    });

    expect(delay).toBe(1200);
  });

  it("gives dense or error-heavy rounds extra read time without stalling endless pacing", () => {
    const system = new ResolutionFeedbackSystem();
    const cleanSimple = system.reviewAdvanceDelayMs({
      tutorialMode: false,
      category: "simple",
      textLength: 12,
      tokenCount: 4,
      missedCuts: [],
      falseCuts: []
    });
    const denseMistake = system.reviewAdvanceDelayMs({
      tutorialMode: false,
      category: "url",
      textLength: 23,
      tokenCount: 6,
      missedCuts: [7, 13],
      falseCuts: [5, 11, 19]
    });

    expect(denseMistake).toBeGreaterThan(cleanSimple);
    expect(denseMistake).toBeLessThanOrEqual(3300);
    expect(denseMistake - cleanSimple).toBeGreaterThanOrEqual(1000);
  });

  it("allows tutorial reviews to linger longer than endless reviews", () => {
    const system = new ResolutionFeedbackSystem();
    const input = {
      category: "filename",
      textLength: 24,
      tokenCount: 6,
      missedCuts: [4],
      falseCuts: [9]
    };

    expect(system.reviewAdvanceDelayMs({ tutorialMode: true, ...input })).toBeGreaterThan(
      system.reviewAdvanceDelayMs({ tutorialMode: false, ...input })
    );
    expect(system.reviewAdvanceDelayMs({ tutorialMode: true, ...input })).toBeLessThanOrEqual(6200);
  });

  it("gives the final tutorial handoff extra read time before opening the handoff screen", () => {
    const system = new ResolutionFeedbackSystem();
    const input = {
      tutorialMode: true,
      category: "numbers_symbols",
      textLength: 15,
      tokenCount: 6,
      missedCuts: [],
      falseCuts: []
    };
    const normalTutorialDelay = system.reviewAdvanceDelayMs(input);
    const finalTutorialDelay = system.reviewAdvanceDelayMs({
      ...input,
      finalTutorialRound: true
    });

    expect(finalTutorialDelay).toBeGreaterThan(normalTutorialDelay);
    expect(finalTutorialDelay).toBeLessThanOrEqual(7600);
  });
});
