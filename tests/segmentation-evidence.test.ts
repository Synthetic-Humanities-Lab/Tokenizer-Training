import { describe, expect, it } from "vitest";
import {
  displayTokenSegment,
  SEGMENTATION_EVIDENCE_COMPACT_MAX_HEIGHT,
  SEGMENTATION_EVIDENCE_COMPACT_PROMPT_GAP_Y,
  SEGMENTATION_EVIDENCE_DESKTOP_PROMPT_GAP_Y,
  SEGMENTATION_EVIDENCE_REVEAL_MS,
  segmentationEvidenceChipSpans,
  segmentationEvidenceHeaderLineCount,
  segmentationEvidenceLayout,
  segmentationEvidenceRevealState,
  segmentationEvidenceTokenRows,
  segmentationEvidenceText
} from "../src/game/systems/SegmentationEvidenceSystem";
import {
  computePlayLayout,
  shortLandscapeReviewColumns,
  usesShortLandscapeReviewLayout,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

describe("SegmentationEvidenceSystem", () => {
  it("renders spaces literally instead of spelling them out", () => {
    expect(displayTokenSegment(" can")).toBe(" can");
    expect(displayTokenSegment(" ")).toBe(" ");
    expect(displayTokenSegment("")).toBe("[empty]");
  });

  it("renders token evidence without the old [space] marker", () => {
    const evidence = segmentationEvidenceText(["I", " can", "'t"]);

    expect(evidence).toContain("TOKEN SPLIT - 3 TOKENS");
    expect(evidence).toContain("< can>");
    expect(evidence).not.toContain("[space]");
    expect(evidence).not.toMatch(/actual tokenization/i);
  });

  it("separates submitted cuts from tokenizer truth before the chip row", () => {
    const evidence = segmentationEvidenceText(["I", " can", "'t"], {
      submittedCutCount: 3,
      truthBoundaryCount: 2
    });
    const rows = evidence.split("\n");

    expect(rows[0]).toBe("TOKEN SPLIT - 3 TOKENS");
    expect(rows[1]).toBe("CUT CHECK - YOUR CUTS 3 | TRUE EDGES 2");
    expect(rows).toHaveLength(3);
    expect(evidence).toContain("< can>");
  });

  it("puts token split and the resolved cut audit before token chips so player cuts map to outcome", () => {
    const evidence = segmentationEvidenceText(["I", " can", "'t"], {
      submittedCutCount: 3,
      truthBoundaryCount: 2,
      correctCutCount: 1,
      missedCutCount: 1,
      falseCutCount: 2
    });
    const compact = segmentationEvidenceText(["I", " can", "'t"], {
      compact: true,
      submittedCutCount: 3,
      truthBoundaryCount: 2,
      correctCutCount: 1,
      missedCutCount: 1,
      falseCutCount: 2
    });

    expect(evidence.split("\n")[0]).toBe("TOKEN SPLIT - 3 TOKENS");
    expect(evidence.split("\n")[1]).toBe("CUT AUDIT - YOUR CUTS 3 | OK 1 | MISS 1 | FALSE 2");
    expect(compact.split("\n")[0]).toBe("TOKENS 3");
    expect(compact.split("\n")[1]).toBe("YOUR CUTS 3 | OK 1 M 1 F 2");
    expect(evidence.split("\n")).toHaveLength(3);
    expect(segmentationEvidenceHeaderLineCount(evidence)).toBe(2);
    expect(segmentationEvidenceTokenRows(evidence)).toEqual(["<I> < can> <'t>"]);
  });

  it("exposes chip spans for visual token backing, including leading-space chunks", () => {
    const evidence = segmentationEvidenceText(["spaces", " matter", "!"]);
    const spans = segmentationEvidenceChipSpans(evidence);

    expect(spans.map((span) => span.text)).toEqual(["<spaces>", "< matter>", "<!>"]);
    expect(spans.map((span) => span.leadingSpace)).toEqual([false, true, false]);
    expect(spans.every((span) => span.length > 0)).toBe(true);
  });

  it("keeps chip spans indexed to token rows after the two-line cut audit header", () => {
    const evidence = segmentationEvidenceText(["I", " can", "'t"], {
      submittedCutCount: 3,
      truthBoundaryCount: 2,
      correctCutCount: 1,
      missedCutCount: 1,
      falseCutCount: 2
    });
    const spans = segmentationEvidenceChipSpans(evidence);

    expect(segmentationEvidenceHeaderLineCount(evidence)).toBe(2);
    expect(segmentationEvidenceTokenRows(evidence)).toEqual(["<I> < can> <'t>"]);
    expect(spans.map((span) => span.rowIndex)).toEqual([0, 0, 0]);
    expect(spans.map((span) => span.text)).toEqual(["<I>", "< can>", "<'t>"]);
  });

  it("uses a direct compact header so phone evidence reads as token chips first", () => {
    const evidence = segmentationEvidenceText(["open", "ai", ".com"], { compact: true });
    const owned = segmentationEvidenceText(["open", "ai", ".com"], {
      compact: true,
      submittedCutCount: 2,
      truthBoundaryCount: 2
    });

    expect(evidence.split("\n")[0]).toBe("TOKENS 3");
    expect(owned.split("\n")[0]).toBe("TOKENS 3");
    expect(owned.split("\n")[1]).toBe("YOUR CUTS 2 | TRUE EDGES 2");
  });

  it("gives review evidence a prominent panel on desktop and compact phones", () => {
    const desktop = segmentationEvidenceLayout({
      viewport: { width: 960, height: 720 },
      textPanel: { x: 480, y: 344, width: 900, height: 96 },
      compact: false,
      lineCount: 2
    });
    const phone = segmentationEvidenceLayout({
      viewport: { width: 320, height: 568 },
      textPanel: { x: 160, y: 320, width: 288, height: 96 },
      compact: true,
      lineCount: 3
    });

    expect(desktop.text.fontSize).toBeGreaterThanOrEqual(22);
    expect(desktop.panel.width).toBeGreaterThanOrEqual(840);
    expect(desktop.panel.y - desktop.panel.height / 2).toBeGreaterThan(344 + 48);
    expect(phone.text.fontSize).toBeGreaterThanOrEqual(15);
    expect(phone.panel.width).toBeGreaterThanOrEqual(288);
    expect(phone.panel.y + phone.panel.height / 2).toBeLessThanOrEqual(568 - 118);
  });

  it("keeps the hidden desktop token-evidence geometry close to the prompt for QA metadata", () => {
    const play = computePlayLayout({ width: 960, height: 720 });
    const textPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const evidence = segmentationEvidenceLayout({
      viewport: { width: 960, height: 720 },
      textPanel,
      compact: play.compact,
      lineCount: 2
    });

    expect(edges(evidence.panel).top - edges(textPanel).bottom).toBe(SEGMENTATION_EVIDENCE_DESKTOP_PROMPT_GAP_Y);
    expect(evidence.panel.width).toBeGreaterThanOrEqual(830);
  });

  it("keeps compact hidden token-evidence geometry bounded for QA metadata", () => {
    const play = computePlayLayout({ width: 390, height: 844 });
    const textPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const evidence = segmentationEvidenceLayout({
      viewport: { width: 390, height: 844 },
      textPanel,
      compact: play.compact,
      lineCount: 4
    });

    expect(evidence.panel.height).toBe(SEGMENTATION_EVIDENCE_COMPACT_MAX_HEIGHT);
    expect(SEGMENTATION_EVIDENCE_COMPACT_PROMPT_GAP_Y).toBeLessThan(28);
    expect(edges(evidence.panel).top).toBeLessThan(edges(textPanel).bottom + 32);
    expect(edges(evidence.panel).bottom).toBeLessThanOrEqual(844 - 118);
  });

  it("uses a left review column for token evidence on short landscape desktops", () => {
    const width = 960;
    const height = 520;
    const play = computePlayLayout({ width, height });
    const textPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const evidence = segmentationEvidenceLayout({
      viewport: { width, height },
      textPanel,
      compact: play.compact,
      lineCount: 2
    });
    const columns = shortLandscapeReviewColumns({ width, height });

    expect(usesShortLandscapeReviewLayout({ width, height })).toBe(true);
    expect(play.compact).toBe(false);
    expect(evidence.panel.x).toBe(columns.evidence.x);
    expect(evidence.panel.width).toBe(columns.evidence.width);
    expect(evidence.text.fontSize).toBeGreaterThanOrEqual(18);
    expect(evidence.text.fontSize).toBeLessThan(22);
    expect(edges(evidence.panel).top).toBeGreaterThanOrEqual(edges(textPanel).bottom + 8);
    expect(edges(evidence.panel).right).toBeLessThan(width / 2);
  });

  it("gives actual-tokenization evidence a short reveal beat after resolve", () => {
    const start = segmentationEvidenceRevealState({ elapsedMs: 0 });
    const middle = segmentationEvidenceRevealState({ elapsedMs: SEGMENTATION_EVIDENCE_REVEAL_MS / 2 });
    const done = segmentationEvidenceRevealState({ elapsedMs: SEGMENTATION_EVIDENCE_REVEAL_MS });
    const settled = segmentationEvidenceRevealState();

    expect(SEGMENTATION_EVIDENCE_REVEAL_MS).toBeGreaterThanOrEqual(380);
    expect(SEGMENTATION_EVIDENCE_REVEAL_MS).toBeLessThanOrEqual(560);
    expect(start.active).toBe(true);
    expect(start.progress).toBe(0);
    expect(start.panelAlpha).toBeGreaterThanOrEqual(0.84);
    expect(start.textAlpha).toBeGreaterThanOrEqual(0.84);
    expect(start.panelAlpha).toBeLessThan(done.panelAlpha);
    expect(start.textAlpha).toBeLessThan(done.textAlpha);
    expect(start.accentAlpha).toBeGreaterThan(middle.accentAlpha);
    expect(middle.accentAlpha).toBeGreaterThan(done.accentAlpha);
    expect(done.active).toBe(false);
    expect(done.progress).toBe(1);
    expect(done.accentAlpha).toBe(0);
    expect(done.topRuleWidthScale).toBe(1);
    expect(settled.active).toBe(false);
    expect(settled.progress).toBe(1);
  });
});
