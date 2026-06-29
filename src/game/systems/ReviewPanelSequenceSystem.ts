export interface ReviewPanelSequenceInput {
  tutorialMode: boolean;
  compact: boolean;
  viewportHeight: number;
  baseReviewDelayMs: number;
}

export interface ReviewPanelSequence {
  evidenceDelayMs: number;
  feedbackDelayMs: number;
  speechDelayMs: number;
  reviewDelayMs: number;
}

const SHORT_PHONE_HEIGHT = 640;
export const REVIEW_EVIDENCE_REVEAL_MS = 180;
export const REVIEW_FEEDBACK_REVEAL_MS = 340;
export const SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS = 280;
export const TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS = 620;
export const TUTORIAL_REVIEW_CONTINUE_DWELL_MS = 700;

export function reviewPanelSequence(input: ReviewPanelSequenceInput): ReviewPanelSequence {
  const shortPhone = input.compact && input.viewportHeight < SHORT_PHONE_HEIGHT;
  const evidenceDelayMs = shortPhone ? 140 : REVIEW_EVIDENCE_REVEAL_MS;
  const feedbackDelayMs = input.tutorialMode
    ? evidenceDelayMs + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS
    : shortPhone ? SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS : REVIEW_FEEDBACK_REVEAL_MS;

  return {
    evidenceDelayMs,
    feedbackDelayMs,
    speechDelayMs: feedbackDelayMs,
    reviewDelayMs: input.baseReviewDelayMs + feedbackDelayMs
  };
}
