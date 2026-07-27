import { describe, expect, it } from "vitest";
import {
  ENDLESS_CLEAN_REVIEW_CONTINUE_MS,
  ENDLESS_ERROR_REVIEW_CONTINUE_MS,
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
      continueDelayMs: REVIEW_EVIDENCE_REVEAL_MS + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS + TUTORIAL_REVIEW_CONTINUE_DWELL_MS,
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
      continueDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS + TUTORIAL_REVIEW_CONTINUE_DWELL_MS,
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
      continueDelayMs: 140 + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS + TUTORIAL_REVIEW_CONTINUE_DWELL_MS,
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
      continueDelayMs: ENDLESS_CLEAN_REVIEW_CONTINUE_MS,
      reviewDelayMs: 3300
    });
  });

  it("keeps endless review feedback ahead of the tutorial learning beat", () => {
    const endless = reviewPanelSequence({
      tutorialMode: false,
      compact: false,
      viewportHeight: 844,
      baseReviewDelayMs: 1500
    });
    const tutorial = reviewPanelSequence({
      tutorialMode: true,
      compact: false,
      viewportHeight: 844,
      baseReviewDelayMs: 4200
    });

    expect(endless.evidenceDelayMs).toBeLessThan(endless.feedbackDelayMs);
    expect(endless.feedbackDelayMs).toBe(REVIEW_FEEDBACK_REVEAL_MS);
    expect(endless.continueDelayMs).toBe(ENDLESS_CLEAN_REVIEW_CONTINUE_MS);
    expect(endless.reviewDelayMs).toBe(2040);
    expect(tutorial.feedbackDelayMs - tutorial.evidenceDelayMs).toBe(TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS);
    expect(tutorial.reviewDelayMs - endless.reviewDelayMs).toBeGreaterThanOrEqual(2900);
  });

  it("makes an error review manually advanceable later than a clean review", () => {
    const clean = reviewPanelSequence({
      tutorialMode: false,
      compact: true,
      viewportHeight: 844,
      baseReviewDelayMs: 900
    });
    const error = reviewPanelSequence({
      tutorialMode: false,
      compact: true,
      viewportHeight: 844,
      baseReviewDelayMs: 2100,
      hasErrors: true
    });

    expect(clean.continueDelayMs).toBe(ENDLESS_CLEAN_REVIEW_CONTINUE_MS);
    expect(error.continueDelayMs).toBe(ENDLESS_ERROR_REVIEW_CONTINUE_MS);
    expect(error.continueDelayMs).toBeGreaterThan(clean.continueDelayMs);
  });
});
