import { describe, expect, it } from "vitest";
import {
  REVIEW_EVIDENCE_REVEAL_MS,
  REVIEW_FEEDBACK_REVEAL_MS,
  reviewPanelSequence,
  SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS,
  TUTORIAL_REVIEW_CONTINUE_DWELL_MS,
  TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS
} from "../src/game/systems/ReviewPanelSequenceSystem";

describe("reviewPanelSequence", () => {
  it("stages normal tutorial review evidence before feedback and speech", () => {
    expect(TUTORIAL_REVIEW_CONTINUE_DWELL_MS).toBeGreaterThanOrEqual(600);
    expect(TUTORIAL_REVIEW_CONTINUE_DWELL_MS).toBeLessThanOrEqual(900);

    expect(reviewPanelSequence({
      tutorialMode: true,
      compact: true,
      viewportHeight: 844,
      baseReviewDelayMs: 4200
    })).toEqual({
      evidenceDelayMs: REVIEW_EVIDENCE_REVEAL_MS,
      feedbackDelayMs: REVIEW_EVIDENCE_REVEAL_MS + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      speechDelayMs: REVIEW_EVIDENCE_REVEAL_MS + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      reviewDelayMs: 5000
    });
  });

  it("uses a tighter evidence reveal on short phones while preserving the tutorial read beat", () => {
    expect(reviewPanelSequence({
      tutorialMode: true,
      compact: true,
      viewportHeight: 568,
      baseReviewDelayMs: 4200
    })).toEqual({
      evidenceDelayMs: 140,
      feedbackDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      speechDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      reviewDelayMs: 4960
    });
  });

  it("preserves longer base review delays after the reveal lands", () => {
    expect(reviewPanelSequence({
      tutorialMode: true,
      compact: true,
      viewportHeight: 568,
      baseReviewDelayMs: 6200
    })).toEqual({
      evidenceDelayMs: 140,
      feedbackDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      speechDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS,
      reviewDelayMs: 6960
    });
  });

  it("stages endless reviews with speech tied to feedback", () => {
    expect(reviewPanelSequence({
      tutorialMode: false,
      compact: true,
      viewportHeight: 568,
      baseReviewDelayMs: 2800
    })).toEqual({
      evidenceDelayMs: 140,
      feedbackDelayMs: SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS,
      speechDelayMs: SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS,
      reviewDelayMs: 3080
    });
  });
});
