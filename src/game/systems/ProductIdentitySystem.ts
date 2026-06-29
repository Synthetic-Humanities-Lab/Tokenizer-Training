export const PRODUCT_NAME = "Tokenizer Training";
export const PRODUCT_TITLE = `${PRODUCT_NAME} - WienerWorks`;
export const PRODUCT_ROOT_LABEL = `${PRODUCT_NAME} by WienerWorks`;
export const PRODUCT_SUMMARY_TITLE = `${PRODUCT_NAME} playtest summary`;

export const STORAGE_PREFIX = "tokenizer-training";
export const PREVIOUS_STORAGE_PREFIX = "tokenization-training";
export const LEGACY_STORAGE_PREFIX = "manual-tokenization-training";
export const LEGACY_STORAGE_PREFIXES = [PREVIOUS_STORAGE_PREFIX, LEGACY_STORAGE_PREFIX] as const;

export const QA_SNAPSHOT_ID = `${STORAGE_PREFIX}-qa`;
export const QA_CANVAS_CAPTURE_ID = `${STORAGE_PREFIX}-canvas-qa`;
export const PREVIOUS_QA_SNAPSHOT_ID = `${PREVIOUS_STORAGE_PREFIX}-qa`;
export const PREVIOUS_QA_CANVAS_CAPTURE_ID = `${PREVIOUS_STORAGE_PREFIX}-canvas-qa`;
export const LEGACY_QA_SNAPSHOT_ID = `${LEGACY_STORAGE_PREFIX}-qa`;
export const LEGACY_QA_CANVAS_CAPTURE_ID = `${LEGACY_STORAGE_PREFIX}-canvas-qa`;
export const QA_SNAPSHOT_IDS = [QA_SNAPSHOT_ID, PREVIOUS_QA_SNAPSHOT_ID, LEGACY_QA_SNAPSHOT_ID] as const;
export const QA_CANVAS_CAPTURE_IDS = [
  QA_CANVAS_CAPTURE_ID,
  PREVIOUS_QA_CANVAS_CAPTURE_ID,
  LEGACY_QA_CANVAS_CAPTURE_ID
] as const;

export const PLAYTEST_RUN_PREFIX = "tt";
export const LEGACY_PLAYTEST_RUN_PREFIX = "mtt";
export const SUMMARY_FILENAME_PREFIX = `${STORAGE_PREFIX}-summary`;
