export interface ReviewPanelSequenceInput {
  tutorialMode: boolean;
  compact: boolean;
  viewportHeight: number;
  baseReviewDelayMs: number;
  hasErrors?: boolean;
}

export interface ReviewPanelSequence {
  evidenceDelayMs: number;
  feedbackDelayMs: number;
  speechDelayMs: number;
  continueDelayMs: number;
  reviewDelayMs: number;
}

const SHORT_PHONE_HEIGHT = 640;
export const REVIEW_EVIDENCE_REVEAL_MS = 180;
export const REVIEW_FEEDBACK_REVEAL_MS = 540;
export const SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS = 500;
export const TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS = 620;
export const TUTORIAL_REVIEW_CONTINUE_DWELL_MS = 700;
export const ENDLESS_CLEAN_REVIEW_CONTINUE_MS = 900;
export const ENDLESS_ERROR_REVIEW_CONTINUE_MS = 1200;

export function reviewPanelSequence(input: ReviewPanelSequenceInput): ReviewPanelSequence {
  const shortPhone = input.compact && input.viewportHeight < SHORT_PHONE_HEIGHT;
  const evidenceDelayMs = shortPhone ? 140 : REVIEW_EVIDENCE_REVEAL_MS;
  const feedbackDelayMs = input.tutorialMode
    ? evidenceDelayMs + TUTORIAL_REVIEW_EVIDENCE_READ_BEAT_MS
    : shortPhone ? SHORT_PHONE_REVIEW_FEEDBACK_REVEAL_MS : REVIEW_FEEDBACK_REVEAL_MS;
  const continueDelayMs = input.tutorialMode
    ? feedbackDelayMs + TUTORIAL_REVIEW_CONTINUE_DWELL_MS
    : input.hasErrors ? ENDLESS_ERROR_REVIEW_CONTINUE_MS : ENDLESS_CLEAN_REVIEW_CONTINUE_MS;

  return {
    evidenceDelayMs,
    feedbackDelayMs,
    speechDelayMs: feedbackDelayMs,
    continueDelayMs,
    reviewDelayMs: input.baseReviewDelayMs + feedbackDelayMs
  };
}
