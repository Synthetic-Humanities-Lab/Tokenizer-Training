import { describe, expect, it, vi } from "vitest";
import {
  AudioSystem,
  CUT_CONFIRMATION_CUE_SPACING_MS,
  MAX_CUT_CONFIRMATION_CUES,
  audioCueShapes,
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
  it("plays a compact positive resolve cue stack for clean rounds", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [],
      falseCuts: [],
      balance: 40
    });

    expect(cues).toEqual(["resolve", "good"]);
  });

  it("distinguishes missed and false cuts with separate cues", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [3],
      falseCuts: [5],
      balance: 40
    });

    expect(cues).toEqual(["resolve", "miss", "falseCut", "bad"]);
  });

  it("adds a warning cue for low balance after resolution", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [],
      falseCuts: [5],
      balance: 9.75
    });

    expect(cues).toEqual(["resolve", "falseCut", "bad", "warning"]);
  });

  it("maps resolved outcomes to one tactile cue so touch commits feel consequential", () => {
    const system = new ResolutionFeedbackSystem();

    expect(system.hapticCue({
      missedCuts: [],
      falseCuts: [],
      balance: 40
    })).toBe("confirm");
    expect(system.hapticCue({
      missedCuts: [3],
      falseCuts: [],
      balance: 40
    })).toBe("miss");
    expect(system.hapticCue({
      missedCuts: [],
      falseCuts: [5],
      balance: 40
    })).toBe("miss");
    expect(system.hapticCue({
      missedCuts: [3],
      falseCuts: [5],
      balance: 9.75
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

  it("keeps resolution feedback cues short and sonically distinct", () => {
    const cues = ["resolve", "good", "bad", "miss", "falseCut", "warning"] as const;
    const signatures = new Set(cues.map((cue) => {
      const shape = audioCueShapes[cue];
      return `${shape.frequency}:${shape.endFrequency ?? "hold"}:${shape.type}`;
    }));

    for (const cue of cues) {
      expect(audioCueShapes[cue].durationMs).toBeLessThanOrEqual(250);
      expect(["sine", "triangle"]).toContain(audioCueShapes[cue].type);
    }
    expect(signatures.size).toBe(cues.length);
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

  it("plans fast multi-cut confirmation bursts without turning one swipe into noise", () => {
    expect(MAX_CUT_CONFIRMATION_CUES).toBe(4);
    expect(CUT_CONFIRMATION_CUE_SPACING_MS).toBeGreaterThanOrEqual(20);
    expect(CUT_CONFIRMATION_CUE_SPACING_MS).toBeLessThanOrEqual(30);
    expect(cutConfirmationAudioCues(0)).toEqual([]);
    expect(cutConfirmationAudioCues(1)).toEqual(["cut"]);
    expect(cutConfirmationAudioCues(3)).toEqual(["cut", "cut", "cut"]);
    expect(cutConfirmationAudioCues(99)).toEqual(["cut", "cut", "cut", "cut"]);

    const scheduled = scheduleAudioCues(cutConfirmationAudioCues(4), CUT_CONFIRMATION_CUE_SPACING_MS);
    expect(scheduled.map((cue) => cue.delayMs)).toEqual([0, 24, 48, 72]);
    expect(Math.max(...scheduled.map((cue) => cue.delayMs))).toBeLessThan(100);
  });

  it("schedules stacked resolution cues distinctly inside the immediate feedback window", () => {
    const cues = new ResolutionFeedbackSystem().audioCues({
      missedCuts: [3],
      falseCuts: [5],
      balance: 8
    });
    const scheduled = scheduleAudioCues(cues);

    expect(cues).toEqual(["resolve", "miss", "falseCut", "bad", "warning"]);
    expect(RESOLUTION_CUE_SPACING_MS).toBeGreaterThan(0);
    expect(new Set(scheduled.map((cue) => cue.delayMs)).size).toBe(cues.length);
    expect(Math.max(...scheduled.map((cue) => cue.delayMs))).toBeLessThanOrEqual(250);
  });

  it("can cancel delayed resolution cues when the scene exits", () => {
    vi.useFakeTimers();
    try {
      const audio = new AudioSystem();

      audio.playSequence(["resolve", "miss", "falseCut", "bad", "warning"]);
      expect(vi.getTimerCount()).toBe(4);

      audio.cancelPending();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
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

    expect(delay).toBe(2800);
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
    expect(denseMistake).toBeLessThanOrEqual(4200);
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
