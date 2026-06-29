import Phaser from "phaser";
import {
  activeCutLabelsHaveRoom,
  activeCutLabelMinGap,
  activeCutMarkerStyle,
  ACTIVE_CUT_PULSE_MS,
  ACTIVE_CUT_STATUS_PULSE_MS,
  activeCutStatusBadgeStyle,
  activeCutStatusText,
  armedCutPreviewStyle,
  autoReleaseCutFeedbackStyle,
  chainSwipeFeedbackStyle,
  clearCutFeedbackStyle,
  cutCorrectionFeedbackStyle,
  inputResponseBadgeState,
  noCutFeedbackDirection,
  noCutFeedbackLabel,
  noCutFeedbackReason,
  noCutFeedbackStyle,
  NO_CUT_FEEDBACK_LABEL,
  type ActiveCutPulseKind,
  type ClearCutFeedbackStyle,
  type CutCorrectionFeedbackStyle,
  type InputResponseBadgeTone,
  type NoCutFeedbackDirection,
  type NoCutFeedbackReason,
  shouldAcknowledgeNoCutGesture,
  shouldShowActiveCutLabels,
  textCutImpactStyle
} from "../systems/ActiveCutFeedbackSystem";
import {
  AudioSystem,
  CUT_CONFIRMATION_CUE_SPACING_MS,
  cutConfirmationAudioCues
} from "../systems/AudioSystem";
import { CutInputSessionSystem } from "../systems/CutInputSessionSystem";
import { DifficultySystem, type DifficultyState } from "../systems/DifficultySystem";
import { FeedbackSystem, type FeedbackSummary } from "../systems/FeedbackSystem";
import {
  clearGameQaSnapshot,
  writeGameQaImageCapture,
  writeGameQaSnapshot,
  type GameQaRect,
  type GameQaSnapshot
} from "../systems/GameQaSystem";
import { encodeRgbaPngDataUrl } from "../systems/GameQaPngSystem";
import {
  hudImpactVisualState,
  type HudImpactVisualState
} from "../systems/HudImpactSystem";
import { HapticFeedbackSystem } from "../systems/HapticFeedbackSystem";
import {
  inputModalityFromPointer,
  mergeInputModality,
  type PlaytestInputModality
} from "../systems/InputModalitySystem";
import { InputFeelMetricsSystem, type InputFeelMetricsSnapshot } from "../systems/InputFeelMetricsSystem";
import {
  clearButtonLabel,
  clearButtonVisualState,
  computePlayLayout,
  exitButtonLabel,
  RESOLVE_READY_PULSE_MS,
  resolveButtonVisualState,
  shouldShowPlayHeaderBrand,
  usesShortLandscapeReviewLayout
} from "../systems/PlayLayoutSystem";
import { playSceneQaSnapshot } from "../systems/PlaySceneQaSystem";
import { playSceneQaControlsFromUrl, type PlaySceneQaControls } from "../systems/PlaySceneQaControlSystem";
import { PRODUCT_NAME } from "../systems/ProductIdentitySystem";
import {
  promptAcquisitionVisualState,
  type PromptAcquisitionVisualState
} from "../systems/PromptAcquisitionSystem";
import { RankSystem } from "../systems/RankSystem";
import {
  reviewPanelSequence,
  TUTORIAL_REVIEW_CONTINUE_DWELL_MS
} from "../systems/ReviewPanelSequenceSystem";
import {
  ResolutionFeedbackSystem,
  resolutionCommitBeatLabel,
  resolutionCommitBeatStyle,
  resolutionCutLabelMinGap,
  resolutionCutLabelModeForGroups,
  resolutionLabelOffset,
  type ResolutionCommitTrigger,
  type ResolutionCutLabelMode
} from "../systems/ResolutionFeedbackSystem";
import {
  computePetSpeechLayout,
  robotBriefLine,
  robotToastDurationMs,
  robotToastMaxLength,
  robotToastSourceText
} from "../systems/RobotCommentSystem";
import { ScoringSystem, type RoundScoreResult } from "../systems/ScoringSystem";
import { sceneClockNow } from "../systems/SceneClockSystem";
import { SentenceMotionSystem, type SentenceMotionState } from "../systems/SentenceMotionSystem";
import { SessionFlowSystem, type SessionOutcome, type SessionRoundTrace } from "../systems/SessionFlowSystem";
import {
  segmentationEvidenceChipSpans,
  segmentationEvidenceHeaderLineCount,
  segmentationEvidenceLayout,
  segmentationEvidenceRevealState,
  segmentationEvidenceTokenRows,
  segmentationEvidenceText,
  type SegmentationEvidenceRevealState
} from "../systems/SegmentationEvidenceSystem";
import type { PlaySessionStartSource } from "../systems/SessionStartSystem";
import {
  playableSlotHintVisualStyle,
  shouldShowPlayableSlotHints
} from "../systems/SlotHintPolicySystem";
import { StorageSystem, type HighScoreRecord } from "../systems/StorageSystem";
import { SwipeCutSystem, type BoundarySlot, type Point } from "../systems/SwipeCutSystem";
import {
  appendTrailPoint,
  buildOrangeBrushTrailSegments,
  SWIPE_TRAIL_FADE_MS,
  type TrailPoint
} from "../systems/SwipeTrailSystem";
import {
  shouldPlayTimeWarning,
  timerPressureVisualState,
  type TimerPressureVisualState
} from "../systems/TimePressureSystem";
import {
  touchAimLoupeState,
  type TouchAimLoupePlacement,
  touchAimLoupeVisualStyle,
  type TouchAimLoupeState
} from "../systems/TouchAimLoupeSystem";
import { buildSubmittedCutTextPieces } from "../systems/TextSplitAnimationSystem";
import type { TutorialCompletePerformance } from "../systems/TutorialCompleteContentSystem";
import {
  displayLength,
  TokenizerSystem,
  type TokenFixture
} from "../systems/TokenizerSystem";
import {
  TUTORIAL_ROUND_DURATION_MS,
  TutorialSystem,
  type TutorialRound
} from "../systems/TutorialSystem";
import {
  wienerCutReaction,
  wienerResolveReaction,
  type WienerReactionKind,
  type WienerReactionPlan
} from "../systems/WienerReactionSystem";
import { computeFeedbackCardLayout, FeedbackCard } from "../ui/FeedbackCard";
import { computeHudLayout, Hud } from "../ui/Hud";
import { computeOverseerPanelLayout, OverseerPanel } from "../ui/OverseerPanel";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";
import type { WienerGlyphMood } from "../ui/WienerGlyph";
import { addWienerImage, sizeWienerImage } from "../ui/WienerSprite";

interface PlaySceneData {
  tutorial?: boolean;
  startSource?: PlaySessionStartSource;
}

interface ActiveCutLabel {
  boundary: number;
  label: Phaser.GameObjects.Text;
}

interface FooterMetricText {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
}

interface NoCutPreviewSnapshot {
  boundary: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strength: number;
}

interface PendingReviewReveal {
  fixture: TokenFixture;
  score: RoundScoreResult;
  summary: FeedbackSummary;
  resolutionLine: string;
  evidenceAtMs: number;
  feedbackAtMs: number;
  evidenceRevealed: boolean;
  feedbackRevealed: boolean;
}

interface PlayQaSnapshotOptions {
  captureCanvas?: boolean;
}

type WienerMood = WienerGlyphMood;
type RoundResolveTrigger = ResolutionCommitTrigger;

const RECENT_FIXTURE_HISTORY_LIMIT = 4;
const FALLING_TEXT_PIECE_DEPTH = 7.4;
const POINTER_SAMPLE_MIN_DISTANCE_PX = 1.75;

function activeCutLabelText(kind: ActiveCutPulseKind | undefined): string {
  if (kind === "confirm") {
    return "HELD";
  }

  if (kind === "release") {
    return "SET";
  }

  return "CUT";
}

function inputResponseBadgeToneColor(tone: InputResponseBadgeTone): number {
  if (tone === "adjusted") {
    return uiPalette.amber;
  }

  if (tone === "chained") {
    return uiPalette.warning;
  }

  if (tone === "latched") {
    return uiPalette.amberLight;
  }

  if (tone === "snap") {
    return uiPalette.oxidizedGreen;
  }

  return uiPalette.blueGrey;
}

function distanceSquared(a: Point, b: Point): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export class PlayScene extends Phaser.Scene {
  private readonly tokenizer = new TokenizerSystem();
  private readonly scoring = new ScoringSystem();
  private readonly difficulty = new DifficultySystem();
  private readonly feedback = new FeedbackSystem();
  private readonly resolutionFeedback = new ResolutionFeedbackSystem();
  private readonly swipe = new SwipeCutSystem();
  private readonly cutInput = new CutInputSessionSystem(this.swipe);
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private readonly haptics = new HapticFeedbackSystem(this.audio.isMuted());
  private readonly rankSystem = new RankSystem();
  private readonly sessionFlow = new SessionFlowSystem();
  private readonly motion = new SentenceMotionSystem();
  private readonly tutorial = new TutorialSystem();
  private readonly inputFeelMetrics = new InputFeelMetricsSystem();
  private readonly qaControls: PlaySceneQaControls = import.meta.env.DEV
    ? playSceneQaControlsFromUrl(globalThis.location?.href)
    : {};

  private hud!: Hud;
  private overseer!: OverseerPanel;
  private feedbackCard!: FeedbackCard;
  private background!: Phaser.GameObjects.Rectangle;
  private degradationGraphics!: Phaser.GameObjects.Graphics;
  private brandPanel!: Phaser.GameObjects.Rectangle;
  private brandPanelChrome!: Phaser.GameObjects.Graphics;
  private brandGlyph!: Phaser.GameObjects.Graphics;
  private brandCompanyText!: Phaser.GameObjects.Text;
  private brandDivisionText!: Phaser.GameObjects.Text;
  private brandProductText!: Phaser.GameObjects.Text;
  private brandPremiseText!: Phaser.GameObjects.Text;
  private brandLoopText!: Phaser.GameObjects.Text;
  private playfield!: Phaser.GameObjects.Rectangle;
  private segmentationLaneGraphics!: Phaser.GameObjects.Graphics;
  private timerPressureGraphics!: Phaser.GameObjects.Graphics;
  private trainingFooterGraphics!: Phaser.GameObjects.Graphics;
  private trainingFooterGlyph!: Phaser.GameObjects.Graphics;
  private trainingFooterTexts: FooterMetricText[] = [];
  private textPanelShadow!: Phaser.GameObjects.Rectangle;
  private textPanel!: Phaser.GameObjects.Rectangle;
  private textPanelChrome!: Phaser.GameObjects.Graphics;
  private textObject!: Phaser.GameObjects.Text;
  private promptAcquisitionGraphics!: Phaser.GameObjects.Graphics;
  private promptAcquisitionText!: Phaser.GameObjects.Text;
  private cutStatusText!: Phaser.GameObjects.Text;
  private tokenEvidenceChrome!: Phaser.GameObjects.Graphics;
  private tokenStripText!: Phaser.GameObjects.Text;
  private trailGraphics!: Phaser.GameObjects.Graphics;
  private timerTrack!: Phaser.GameObjects.Rectangle;
  private timerFill!: Phaser.GameObjects.Rectangle;
  private chromeBar!: Phaser.GameObjects.Rectangle;
  private chromeText!: Phaser.GameObjects.Text;
  private headerWienerLogo!: Phaser.GameObjects.Image;
  private assistantPanel!: Phaser.GameObjects.Rectangle;
  private assistantPanelChrome!: Phaser.GameObjects.Graphics;
  private assistantHeaderText!: Phaser.GameObjects.Text;
  private assistantNameText!: Phaser.GameObjects.Text;
  private assistantNoteText!: Phaser.GameObjects.Text;
  private assistantText!: Phaser.GameObjects.Text;
  private assistantGlyph!: Phaser.GameObjects.Graphics;
  private petWiener!: Phaser.GameObjects.Image;
  private petReactionTween?: Phaser.Tweens.Tween;
  private petIdleTween?: Phaser.Tweens.Tween;
  private petWienerBaseX = 0;
  private petWienerBaseY = 0;
  private petWienerBaseScaleX = 1;
  private petWienerBaseScaleY = 1;
  private petReactionKind: WienerReactionKind | null = null;
  private petReactionPeakScaleX = 1;
  private petReactionPeakScaleY = 1;
  private robotToastPanel!: Phaser.GameObjects.Rectangle;
  private robotToastChrome!: Phaser.GameObjects.Graphics;
  private robotToastLabel!: Phaser.GameObjects.Text;
  private robotToastText!: Phaser.GameObjects.Text;
  private tutorialPopupPanel!: Phaser.GameObjects.Rectangle;
  private tutorialPopupHeader!: Phaser.GameObjects.Rectangle;
  private tutorialPopupChrome!: Phaser.GameObjects.Graphics;
  private tutorialPopupTitle!: Phaser.GameObjects.Text;
  private tutorialPopupBody!: Phaser.GameObjects.Text;
  private tutorialPopupStamp!: Phaser.GameObjects.Text;
  private resolveButton!: Phaser.GameObjects.Rectangle;
  private resolveLabel!: Phaser.GameObjects.Text;
  private resolvePointerDownCanAdvanceReview = true;
  private resolveReadyPulseStartedAt?: number;
  private clearButton!: Phaser.GameObjects.Rectangle;
  private clearLabel!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteLabel!: Phaser.GameObjects.Text;
  private exitButton!: Phaser.GameObjects.Rectangle;
  private exitLabel!: Phaser.GameObjects.Text;
  private cutMarkers: Phaser.GameObjects.GameObject[] = [];
  private activeCutGraphics!: Phaser.GameObjects.Graphics;
  private clearCutFeedbackGraphics!: Phaser.GameObjects.Graphics;
  private armedCutPreviewGraphics!: Phaser.GameObjects.Graphics;
  private touchAimLoupeGraphics!: Phaser.GameObjects.Graphics;
  private touchAimLoupeText!: Phaser.GameObjects.Text;
  private activeCutLabels: ActiveCutLabel[] = [];
  private resolvedCutLabelRects: Array<{ text: string; rect: GameQaRect }> = [];
  private resolutionAuditLegendRect?: GameQaRect;
  private resolutionAuditLegendText = "";
  private cutStatusBadgeGraphics!: Phaser.GameObjects.Graphics;
  private cutStatusBadgeRect?: GameQaRect;
  private resolveCommitGraphics!: Phaser.GameObjects.Graphics;
  private resolveCommitText!: Phaser.GameObjects.Text;
  private resolveCommitTween?: Phaser.Tweens.Tween;
  private resolveCommitRect?: GameQaRect;
  private lastResolveTrigger: RoundResolveTrigger | null = null;
  private lastCutStatusCount = 0;
  private cutStatusPulseStartedAt?: number;
  private activeCutPulseStartedAt = new Map<number, { startedAt: number; kind: ActiveCutPulseKind }>();
  private activeCutPulseTimer?: Phaser.Time.TimerEvent;
  private inputResponseBadgeGraphics!: Phaser.GameObjects.Graphics;
  private inputResponseBadgeText!: Phaser.GameObjects.Text;
  private inputResponseBadgeRect?: GameQaRect;
  private inputResponseBadgeTone?: InputResponseBadgeTone;
  private clearCutFeedbackTween?: Phaser.Tweens.Tween;
  private clearCutFeedbackRect?: GameQaRect;
  private cutCorrectionFeedbackRect?: GameQaRect;
  private chainSwipeFeedbackGraphics!: Phaser.GameObjects.Graphics;
  private chainSwipeFeedbackTween?: Phaser.Tweens.Tween;
  private chainSwipeFeedbackRect?: GameQaRect;
  private noCutFeedbackGraphics!: Phaser.GameObjects.Graphics;
  private noCutFeedbackText!: Phaser.GameObjects.Text;
  private noCutFeedbackTween?: Phaser.Tweens.Tween;
  private noCutFeedbackScuffTween?: Phaser.Tweens.Tween;
  private noCutFeedbackRect?: GameQaRect;
  private noCutFeedbackReason?: NoCutFeedbackReason;
  private noCutFeedbackDirection?: NoCutFeedbackDirection;
  private textCutImpactTween?: Phaser.Tweens.Tween;
  private textCutImpactGhost?: Phaser.GameObjects.Text;
  private slotHintGraphics!: Phaser.GameObjects.Graphics;
  private targetHintGraphics!: Phaser.GameObjects.Graphics;
  private trailPoints: TrailPoint[] = [];
  private trailFadeTween?: Phaser.Tweens.Tween;
  private fallingTextPieces: Phaser.GameObjects.Text[] = [];
  private lastPointerPoint?: Point;
  private armedPreviewBoundary: number | null = null;
  private armedPreviewStrength: number | null = null;
  private armedPreviewReady = false;
  private armedPreviewRect?: GameQaRect;
  private touchAimLoupeRect?: GameQaRect;
  private touchAimLoupeBoundary: number | null = null;
  private touchAimLoupeSnapReady = false;
  private touchAimLoupePointerClearancePx: number | null = null;
  private touchAimLoupeOcclusionSafe = false;
  private touchAimLoupePlacement: TouchAimLoupePlacement = "hidden";
  private tokenEvidenceRect?: GameQaRect;
  private promptAcquisitionStartedAt?: number;
  private promptAcquisitionRect?: GameQaRect;
  private segmentationEvidenceRevealStartedAt?: number;
  private timerPressureRect?: GameQaRect;
  private timerPressureDeadlineRect?: GameQaRect;
  private gestureTouchedCutBand = false;
  private gestureHadCut = false;
  private gestureAddedCuts = new Set<number>();
  private gestureReleaseSampleCuts = new Set<number>();
  private gestureTouchedExistingCuts = new Set<number>();
  private gestureNoCutPreview?: NoCutPreviewSnapshot;
  private rendererQaCapturePending = false;
  private lastRendererQaCaptureSignature = "";
  private rendererQaCaptureStatus = "idle";
  private tutorialPromptTimer?: Phaser.Time.TimerEvent;
  private tutorialMechanicsTimer?: Phaser.Time.TimerEvent;
  private tutorialByteTimer?: Phaser.Time.TimerEvent;
  private tutorialTokenIdTimer?: Phaser.Time.TimerEvent;
  private tutorialRuleTimer?: Phaser.Time.TimerEvent;
  private tutorialFollowupTimer?: Phaser.Time.TimerEvent;
  private tutorialReviewPanelTimer?: Phaser.Time.TimerEvent;
  private robotToastTimer?: Phaser.Time.TimerEvent;
  private tutorialPopupTimer?: Phaser.Time.TimerEvent;
  private tutorialPopupFullTitle = "";
  private tutorialPopupFullBody = "";
  private robotToastSticky = false;
  private feedbackAdvanceTimer?: Phaser.Time.TimerEvent;
  private resolutionRevealTimers: Phaser.Time.TimerEvent[] = [];
  private reviewRevealTimers: Phaser.Time.TimerEvent[] = [];
  private pendingReviewReveal?: PendingReviewReveal;
  private currentFixture?: TokenFixture;
  private currentTutorialRound?: TutorialRound;
  private sentenceMotion?: SentenceMotionState;
  private currentDifficulty: DifficultyState = this.difficulty.getState(1);
  private currentCuts: number[] = [];
  private highScoreRecord: HighScoreRecord | null = null;
  private roundStartedAt = 0;
  private activeRoundDurationMs = 9000;
  private balance = 40;
  private round = 0;
  private lastPay = 0;
  private lastCost = 0;
  private totalPay = 0;
  private totalCost = 0;
  private totalCorrect = 0;
  private totalMissed = 0;
  private totalFalse = 0;
  private totalPossible = 0;
  private startSource: PlaySessionStartSource = "unknown";
  private inputModality: PlaytestInputModality = "none";
  private previousFixtureId: string | undefined;
  private previousFixtureCategory: string | undefined;
  private recentFixtureIds: string[] = [];
  private recentFixtureCategories: string[] = [];
  private roundTraces: SessionRoundTrace[] = [];
  private resolving = false;
  private tutorialReviewReady = false;
  private tutorialReviewReadyAtMs: number | null = null;
  private tutorialMode = false;
  private compactLayout = false;
  private timeWarningPlayed = false;
  private resolveDeadlinePressureWasActive = false;
  private hudImpactStartedAt: number | null = null;
  private hudImpactNet = 0;
  private focusPauseRequested = false;

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document?.hidden) {
      this.pauseActiveRoundForFocusLoss();
      return;
    }

    this.resumeActiveRoundAfterFocusReturn();
  };

  private readonly handleWindowBlur = (): void => {
    this.pauseActiveRoundForFocusLoss();
  };

  private readonly handleWindowFocus = (): void => {
    if (globalThis.document?.hidden) {
      return;
    }

    this.resumeActiveRoundAfterFocusReturn();
  };

  constructor() {
    super("PlayScene");
  }

  create(data: PlaySceneData): void {
    this.tutorialMode = data.tutorial ?? false;
    this.startSource = data.startSource ?? "unknown";
    this.highScoreRecord = this.storage.loadHighScore();
    this.resetSessionStats();
    this.previousFixtureId = undefined;
    this.previousFixtureCategory = undefined;
    this.recentFixtureIds = [];
    this.recentFixtureCategories = [];
    this.currentTutorialRound = undefined;
    this.sentenceMotion = undefined;
    this.resolving = false;

    this.background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, uiPalette.shell).setOrigin(0);
    this.degradationGraphics = this.add.graphics().setDepth(1);
    this.brandPanel = this.add.rectangle(0, 0, 0, 0, uiPalette.panelLight, 0.94).setDepth(18);
    this.brandPanel.setStrokeStyle(1, uiPalette.stroke, 0.92);
    this.brandPanelChrome = this.add.graphics().setDepth(19);
    this.brandGlyph = this.add.graphics().setDepth(20);
    this.brandCompanyText = this.add.text(0, 0, "WienerWorks", {
      fontFamily: uiFonts.display,
      fontSize: "30px",
      color: uiPalette.text
    }).setDepth(20);
    this.brandDivisionText = this.add.text(0, 0, "Human Segmentation Division", {
      fontFamily: uiFonts.body,
      fontSize: "11px",
      color: "#d65a2b",
      lineSpacing: 1,
      wordWrap: { width: 180 }
    }).setDepth(20);
    this.brandProductText = this.add.text(0, 0, PRODUCT_NAME, {
      fontFamily: uiFonts.body,
      fontSize: "12px",
      color: uiPalette.text,
      lineSpacing: 1,
      wordWrap: { width: 180 }
    }).setDepth(20);
    this.brandPremiseText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.body,
      fontSize: "14px",
      color: uiPalette.textMuted,
      lineSpacing: 5,
      wordWrap: { width: 220 }
    }).setDepth(20);
    this.brandLoopText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "10px",
      color: uiPalette.textMuted,
      lineSpacing: 8,
      wordWrap: { width: 220 }
    }).setDepth(20);
    this.playfield = this.add.rectangle(0, 0, 0, 0, uiPalette.panelTint, 0.42).setOrigin(0.5).setDepth(2);
    this.playfield.setStrokeStyle(1, uiPalette.stroke, 0.72);
    this.segmentationLaneGraphics = this.add.graphics().setDepth(3.2);
    this.timerPressureGraphics = this.add.graphics().setDepth(7.2);
    this.trainingFooterGraphics = this.add.graphics().setDepth(18);
    this.trainingFooterGlyph = this.add.graphics().setDepth(19);
    this.trainingFooterTexts = Array.from({ length: 5 }, () => ({
      label: this.add.text(0, 0, "", {
        fontFamily: uiFonts.mono,
        fontSize: "10px",
        color: uiPalette.textFaint
      }).setDepth(19),
      value: this.add.text(0, 0, "", {
        fontFamily: uiFonts.body,
        fontSize: "12px",
        color: uiPalette.text,
        lineSpacing: 2,
        wordWrap: { width: 120 }
      }).setDepth(19)
    }));
    this.chromeBar = this.add.rectangle(0, 0, 0, 34, uiPalette.panelLight, 0.92).setOrigin(0.5).setDepth(18);
    this.chromeBar.setStrokeStyle(1, uiPalette.stroke, 0.86);
    this.chromeText = this.add.text(0, 0, "WienerWorks", {
      fontFamily: uiFonts.display,
      fontSize: "18px",
      color: uiPalette.text
    }).setOrigin(0, 0.5).setDepth(19);
    this.headerWienerLogo = addWienerImage(this, { x: 0, y: 0, height: 38, depth: 19 });
    this.textPanelShadow = this.add.rectangle(0, 0, 0, 96, uiPalette.panelShadow, 0.14).setDepth(3);
    this.textPanel = this.add.rectangle(0, 0, 0, 96, uiPalette.panelLight, 0.97).setStrokeStyle(1, uiPalette.strokeDark, 0.64);
    this.textPanel.setDepth(4);
    this.textPanelChrome = this.add.graphics().setDepth(5);
    this.textObject = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "34px",
      color: uiPalette.text,
      align: "center"
    }).setOrigin(0.5).setDepth(8);
    this.promptAcquisitionGraphics = this.add.graphics().setDepth(7.75).setVisible(false);
    this.promptAcquisitionText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "10px",
      color: uiPalette.textFaint,
      align: "center"
    }).setOrigin(0.5).setDepth(8.05).setVisible(false);
    this.cutStatusBadgeGraphics = this.add.graphics().setDepth(7.9);
    this.cutStatusText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textFaint,
      align: "center"
    }).setOrigin(0.5).setDepth(8);
    this.inputResponseBadgeGraphics = this.add.graphics().setDepth(7.92).setVisible(false);
    this.inputResponseBadgeText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textMuted,
      align: "center"
    }).setOrigin(0.5).setDepth(8.1).setVisible(false);
    this.noCutFeedbackGraphics = this.add.graphics().setDepth(12.4).setVisible(false);
    this.noCutFeedbackText = this.add.text(0, 0, NO_CUT_FEEDBACK_LABEL, {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textMuted,
      backgroundColor: "#f4eddf",
      align: "center"
    }).setOrigin(0.5).setDepth(13).setVisible(false);
    this.tokenEvidenceChrome = this.add.graphics().setDepth(7.8).setVisible(false);
    this.tokenStripText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "18px",
      color: uiPalette.text,
      align: "center",
      lineSpacing: 6,
      wordWrap: { width: 860 }
    }).setOrigin(0.5).setDepth(8).setVisible(false);
    this.trailGraphics = this.add.graphics().setDepth(14);
    this.activeCutGraphics = this.add.graphics().setDepth(12);
    this.resolveCommitGraphics = this.add.graphics().setDepth(7.35).setVisible(false);
    this.resolveCommitText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textMuted,
      backgroundColor: "#ded7c7"
    }).setOrigin(0.5).setDepth(13.1).setVisible(false);
    this.clearCutFeedbackGraphics = this.add.graphics().setDepth(12.2);
    this.chainSwipeFeedbackGraphics = this.add.graphics().setDepth(12.15).setVisible(false);
    this.armedCutPreviewGraphics = this.add.graphics().setDepth(11);
    this.touchAimLoupeGraphics = this.add.graphics().setDepth(15);
    this.touchAimLoupeText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "14px",
      color: uiPalette.text,
      align: "center"
    }).setOrigin(0.5).setDepth(16).setVisible(false);
    this.slotHintGraphics = this.add.graphics().setDepth(7);
    this.targetHintGraphics = this.add.graphics().setDepth(9);
    this.timerTrack = this.add.rectangle(0, 0, 0, 8, uiPalette.coldGlass, 0.64).setOrigin(0, 0.5).setDepth(16);
    this.timerFill = this.add.rectangle(0, 0, 0, 8, uiPalette.amber).setOrigin(0, 0.5).setDepth(17);
    this.assistantPanel = this.add.rectangle(0, 0, 180, 118, uiPalette.panelLight, 0.94).setStrokeStyle(1, uiPalette.stroke, 0.9).setDepth(18);
    this.assistantPanelChrome = this.add.graphics().setDepth(19);
    this.assistantGlyph = this.add.graphics().setDepth(20);
    this.petWiener = addWienerImage(this, { x: 0, y: 0, height: 82, depth: 31 });
    this.assistantHeaderText = this.add.text(0, 0, "SUPERVISOR", {
      fontFamily: uiFonts.mono,
      fontSize: "10px",
      color: uiPalette.textFaint
    }).setDepth(20);
    this.assistantNameText = this.add.text(0, 0, "Wiener", {
      fontFamily: uiFonts.body,
      fontSize: "14px",
      color: uiPalette.text
    }).setDepth(20);
    this.assistantNoteText = this.add.text(0, 0, "Human route assigned.", {
      fontFamily: uiFonts.body,
      fontSize: "12px",
      color: uiPalette.textMuted,
      lineSpacing: 3,
      wordWrap: { width: 128 }
    }).setDepth(20);
    this.assistantText = this.add.text(0, 0, "TRUST LEVEL: LOW", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textMuted,
      align: "left",
      lineSpacing: 4,
      wordWrap: { width: 210 }
    }).setDepth(20);
    this.robotToastPanel = this.add.rectangle(0, 0, 0, 0, uiPalette.panelLight, 0.97).setStrokeStyle(1, uiPalette.strokeDark, 0.74).setDepth(32);
    this.robotToastChrome = this.add.graphics().setDepth(32.5);
    this.robotToastLabel = this.add.text(0, 0, "WIENER", {
      fontFamily: uiFonts.mono,
      fontSize: "9px",
      color: uiPalette.textFaint
    }).setDepth(33);
    this.robotToastText = this.add.text(0, 0, "", {
      fontFamily: uiFonts.body,
      fontSize: "13px",
      color: uiPalette.text,
      wordWrap: { width: 360 }
    }).setDepth(33);
    this.hideRobotToast();
    this.tutorialPopupPanel = this.add.rectangle(0, 0, 0, 0, uiPalette.panelLight, 0.98).setStrokeStyle(1, uiPalette.strokeDark, 1).setDepth(34);
    this.tutorialPopupHeader = this.add.rectangle(0, 0, 0, 24, uiPalette.panelTint, 0.96).setDepth(35);
    this.tutorialPopupChrome = this.add.graphics().setDepth(35.5);
    this.tutorialPopupTitle = this.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.textMuted
    }).setDepth(36);
    this.tutorialPopupBody = this.add.text(0, 0, "", {
      fontFamily: uiFonts.body,
      fontSize: "14px",
      color: uiPalette.text,
      wordWrap: { width: 420 }
    }).setDepth(36);
    this.tutorialPopupStamp = this.add.text(0, 0, "audit note / margin preserved", {
      fontFamily: uiFonts.mono,
      fontSize: "10px",
      color: uiPalette.textFaint
    }).setDepth(36);
    this.hideTutorialPopup();

    this.resolveButton = this.add.rectangle(0, 0, 180, 40, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke).setDepth(22);
    this.resolveLabel = this.add.text(0, 0, "Resolve", {
      fontFamily: uiFonts.body,
      fontSize: "15px",
      color: uiPalette.text
    }).setOrigin(0.5).setDepth(23);
    this.clearButton = this.add.rectangle(0, 0, 112, 40, buttonVisual.disabledFill, buttonVisual.disabledAlpha).setStrokeStyle(1, buttonVisual.stroke).setDepth(22);
    this.clearLabel = this.add.text(0, 0, "Clear Cuts", {
      fontFamily: uiFonts.body,
      fontSize: "15px",
      color: uiPalette.text
    }).setOrigin(0.5).setDepth(23);
    this.muteButton = this.add.rectangle(0, 0, 112, 40, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke).setDepth(22);
    this.muteLabel = this.add.text(0, 0, "", {
      fontFamily: uiFonts.body,
      fontSize: "15px",
      color: uiPalette.text
    }).setOrigin(0.5).setDepth(23);
    this.exitButton = this.add.rectangle(0, 0, 132, 24, buttonVisual.fill, 0.82).setStrokeStyle(1, buttonVisual.stroke).setDepth(22);
    this.exitLabel = this.add.text(0, 0, "Exit Training", {
      fontFamily: uiFonts.body,
      fontSize: "12px",
      color: uiPalette.text
    }).setOrigin(0.5).setDepth(23);
    this.resolveButton.setInteractive({ useHandCursor: true });
    this.resolveButton.on("pointerover", () => this.applyResolveButtonVisualState(true));
    this.resolveButton.on("pointerout", () => this.applyResolveButtonVisualState(false));
    this.resolveButton.on("pointerdown", () => this.handleResolvePointerDown());
    this.resolveButton.on("pointerup", () => this.handleResolvePointerUp());
    this.clearButton.setInteractive({ useHandCursor: true });
    this.clearButton.on("pointerover", () => this.applyClearButtonVisualState(true));
    this.clearButton.on("pointerout", () => this.applyClearButtonVisualState(false));
    this.clearButton.on("pointerdown", () => this.applyClearButtonVisualState(true, true));
    this.clearButton.on("pointerup", () => this.clearPlayerCuts());
    this.muteButton.setInteractive({ useHandCursor: true });
    this.muteButton.on("pointerover", () => this.muteButton.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha));
    this.muteButton.on("pointerout", () => this.muteButton.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha));
    this.muteButton.on("pointerdown", () => this.muteButton.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));
    this.muteButton.on("pointerup", () => {
      this.muteButton.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha);
      this.toggleMute();
    });
    this.exitButton.setInteractive({ useHandCursor: true });
    this.exitButton.on("pointerover", () => this.exitButton.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha));
    this.exitButton.on("pointerout", () => this.exitButton.setFillStyle(buttonVisual.fill, 0.82));
    this.exitButton.on("pointerdown", () => this.exitButton.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));
    this.exitButton.on("pointerup", () => this.exitToMenu());

    this.hud = new Hud(this);
    this.overseer = new OverseerPanel(this);
    this.feedbackCard = new FeedbackCard(this);

    this.input.on("pointerdown", this.handlePointer, this);
    this.input.on("pointermove", this.handlePointer, this);
    this.input.on("pointerup", this.handlePointerGestureEnd, this);
    this.input.on("pointerupoutside", this.handlePointerGestureEnd, this);
    this.input.on("gameout", this.handlePointerGestureEnd, this);
    this.input.keyboard?.on("keydown-ENTER", this.handleKeyboardResolve, this);
    this.input.keyboard?.on("keydown-SPACE", this.handleKeyboardResolve, this);
    this.input.keyboard?.on("keydown-BACKSPACE", this.handleKeyboardClear, this);
    this.input.keyboard?.on("keydown-DELETE", this.handleKeyboardClear, this);
    this.input.keyboard?.on("keydown-M", this.handleKeyboardMute, this);
    this.input.keyboard?.on("keydown-ESC", this.handleKeyboardExit, this);
    this.scale.on("resize", this.layout, this);
    this.registerFocusPauseListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this);

    this.updateMuteLabel();
    this.layout();
    this.startRound();
  }

  update(time: number): void {
    if (!this.currentFixture) {
      return;
    }

    if (this.resolving) {
      this.updatePendingReviewReveal();
      this.updateSegmentationEvidenceReveal();
      this.updateTutorialReviewReady();
      return;
    }

    const now = this.activeNowMs(time);
    this.updateSentenceMotion(now);
    this.updatePromptAcquisitionBeat(now);
    this.updateHud(now);
    this.updateTimerVisual(now);
    this.updateResolveReadyPulse();
    this.updateResolveDeadlinePressure();
    this.updateInputResponseBadge();
    this.maybePlayTimeWarning(now);
    if (this.sentenceMotion && this.motion.isComplete(this.sentenceMotion, now)) {
      this.resolveRound("deadline");
    }
  }

  private registerFocusPauseListeners(): void {
    globalThis.document?.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.browserWindow()?.addEventListener("blur", this.handleWindowBlur);
    this.browserWindow()?.addEventListener("focus", this.handleWindowFocus);
  }

  private unregisterFocusPauseListeners(): void {
    globalThis.document?.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.browserWindow()?.removeEventListener("blur", this.handleWindowBlur);
    this.browserWindow()?.removeEventListener("focus", this.handleWindowFocus);
  }

  private browserWindow(): Window | undefined {
    return typeof window === "undefined" ? undefined : window;
  }

  private pauseActiveRoundForFocusLoss(): void {
    this.focusPauseRequested = true;
    if (!this.currentFixture || this.resolving || !this.sentenceMotion || this.sentenceMotion.paused) {
      return;
    }

    const now = this.activeNowMs(this.baseNowMs());
    this.sentenceMotion = this.motion.pause(this.sentenceMotion, now);
    this.cancelTransientGestureStateForFocusLoss();
    this.updateSentenceMotion(now);
    this.updateHud(now);
    this.updateTimerVisual(now);
    this.writePlayQaSnapshot();
  }

  private resumeActiveRoundAfterFocusReturn(): void {
    if (!this.focusPauseRequested) {
      return;
    }

    this.focusPauseRequested = false;
    if (!this.currentFixture || this.resolving || !this.sentenceMotion || !this.sentenceMotion.paused) {
      return;
    }

    const now = this.activeNowMs(this.baseNowMs());
    this.sentenceMotion = this.motion.resume(this.sentenceMotion, now);
    this.updateSentenceMotion(now);
    this.updateHud(now);
    this.updateTimerVisual(now);
    this.writePlayQaSnapshot();
  }

  private cancelTransientGestureStateForFocusLoss(): void {
    this.cutInput.endGesture();
    this.lastPointerPoint = undefined;
    this.gestureTouchedCutBand = false;
    this.gestureHadCut = false;
    this.gestureAddedCuts.clear();
    this.gestureReleaseSampleCuts.clear();
    this.gestureTouchedExistingCuts.clear();
    this.gestureNoCutPreview = undefined;
    this.inputFeelMetrics.endGesture();
    this.clearTrail();
  }

  private startRound(): void {
    this.clearCutMarkers();
    this.clearFallingTextPieces();
    this.clearPetReaction();
    this.clearHudImpact();
    this.clearResolutionRevealTimers();
    this.clearReviewRevealTimers();
    this.clearActiveCutMarkers();
    this.clearResolveCommitBeat();
    this.clearClearCutFeedback();
    this.clearChainSwipeFeedback();
    this.clearNoCutFeedback();
    this.clearPromptAcquisitionBeat();
    this.clearTextCutImpact();
    this.clearSlotHints();
    this.clearTrail();
    this.lastPointerPoint = undefined;
    this.tutorialPromptTimer?.remove(false);
    this.tutorialMechanicsTimer?.remove(false);
    this.tutorialByteTimer?.remove(false);
    this.tutorialTokenIdTimer?.remove(false);
    this.tutorialRuleTimer?.remove(false);
    this.tutorialFollowupTimer?.remove(false);
    this.tutorialReviewPanelTimer?.remove(false);
    this.hideTutorialPopup();
    this.feedbackAdvanceTimer?.remove(false);
    this.clearReviewRevealTimers();
    this.feedbackCard.hide();
    this.tokenStripText.setVisible(false);
    this.tokenStripText.setText("");
    this.clearSegmentationEvidenceReveal();
    this.tokenEvidenceChrome.clear();
    this.tokenEvidenceChrome.setVisible(false);
    this.tokenEvidenceRect = undefined;
    this.textObject.setVisible(true);
    this.cutStatusPulseStartedAt = undefined;
    this.lastCutStatusCount = 0;
    this.resolveReadyPulseStartedAt = undefined;
    this.cutStatusBadgeGraphics.clear();
    this.cutStatusBadgeRect = undefined;
    this.clearInputResponseBadge();
    this.cutStatusText.setVisible(true);
    this.inputFeelMetrics.startRound();
    this.currentCuts = [];
    this.gestureTouchedCutBand = false;
    this.gestureHadCut = false;
    this.gestureAddedCuts.clear();
    this.gestureReleaseSampleCuts.clear();
    this.gestureTouchedExistingCuts.clear();
    this.gestureNoCutPreview = undefined;
    this.resolving = false;
    this.lastResolveTrigger = null;
    this.tutorialReviewReady = false;
    this.tutorialReviewReadyAtMs = null;
    if (!this.focusPauseRequested) {
      this.focusPauseRequested = globalThis.document?.hidden ?? false;
    }
    this.showActiveTrail();
    this.timeWarningPlayed = false;
    this.resolveDeadlinePressureWasActive = false;
    this.updateResolveButtonState();
    this.updateClearButtonState();
    this.round += 1;
    this.currentDifficulty = this.difficulty.getState(this.round);
    this.currentFixture = this.pickFixture();
    this.previousFixtureId = this.currentFixture.id;
    this.previousFixtureCategory = this.currentFixture.category;
    this.rememberFixture(this.currentFixture);
    this.textObject.setText(this.currentFixture.text);
    const startedAt = this.baseNowMs();
    this.roundStartedAt = startedAt;
    this.activeRoundDurationMs = this.tutorialMode ? TUTORIAL_ROUND_DURATION_MS : this.currentDifficulty.roundDurationMs;
    this.layout();
    this.startSentenceMotion(startedAt);
    const now = this.nowMs();
    this.updateSentenceMotion(now);
    this.startPromptAcquisitionBeat(startedAt);
    this.updateHud(now);
    this.updateTimerVisual(now);
    const activeLine = this.tutorialMode ? this.tutorialPrompt() : this.sessionFlow.activeTrainingLine(this.balance);
    this.setRobotComment(activeLine, { sticky: true });
    if (this.focusPauseRequested) {
      this.pauseActiveRoundForFocusLoss();
    }
  }

  private pickFixture(): TokenFixture {
    if (this.tutorialMode) {
      this.currentTutorialRound = this.tutorial.byIndex(this.round - 1);
      if (!this.currentTutorialRound) {
        throw new Error(`Missing tutorial round ${this.round}.`);
      }
      const fixture = this.tokenizer.byId(this.currentTutorialRound.fixtureId);
      if (!fixture) {
        throw new Error(`Missing tutorial fixture ${this.currentTutorialRound.fixtureId}.`);
      }
      return fixture;
    }

    this.currentTutorialRound = undefined;
    return this.tokenizer.pickFixture(this.round, {
      tierCap: this.currentDifficulty.tierCap,
      previousId: this.previousFixtureId,
      previousCategory: this.previousFixtureCategory,
      recentIds: this.recentFixtureIds,
      recentCategories: this.recentFixtureCategories,
      preferHighestTier: !this.tutorialMode
    });
  }

  private rememberFixture(fixture: TokenFixture): void {
    this.recentFixtureIds = [...this.recentFixtureIds, fixture.id].slice(-RECENT_FIXTURE_HISTORY_LIMIT);
    this.recentFixtureCategories = [...this.recentFixtureCategories, fixture.category].slice(-RECENT_FIXTURE_HISTORY_LIMIT);
  }

  private tutorialPrompt(): string {
    if (!this.currentTutorialRound) return "Tutorial record unavailable. Predict anyway.";
    return this.tutorial.activePromptFor(this.round - 1);
  }

  private tutorialIntroPrompt(): string {
    if (!this.currentTutorialRound) return "Tutorial record unavailable. Predict anyway.";
    return this.tutorial.introPromptFor(this.round - 1);
  }

  private tutorialReviewSpeechFor(index: number, score: RoundScoreResult): string {
    return this.tutorial.reviewSpeechFor(index, {
      correctCuts: score.correctCuts.length,
      missedCuts: score.missedCuts.length,
      falseCuts: score.falseCuts.length
    });
  }

  private tutorialReviewSpeechMaxLength(): number {
    return this.compactLayout ? 118 : 154;
  }

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    const observedModality = inputModalityFromPointer(pointer);
    if (pointer.isDown) {
      this.inputModality = mergeInputModality(this.inputModality, observedModality);
    }

    if (!this.currentFixture || this.resolving) {
      return;
    }

    const point = { x: pointer.x, y: pointer.y };
    if (!pointer.isDown) {
      this.renderHoverCutPreview(point, observedModality);
      return;
    }

    this.applyPointerCutSample(point);
  }

  private applyPointerCutSample(point: Point, options: { releaseSample?: boolean } = {}): void {
    if (!this.currentFixture || this.resolving) {
      return;
    }

    if (!options.releaseSample && this.lastPointerPoint && distanceSquared(point, this.lastPointerPoint) < POINTER_SAMPLE_MIN_DISTANCE_PX ** 2) {
      return;
    }

    this.inputFeelMetrics.recordSample(this.baseNowMs());
    const previousCutCount = this.currentCuts.length;
    const bounds = this.textObject.getBounds();
    const showSlotHints = this.shouldShowSlotHints();
    const slots = this.swipe.buildPlayableSlots(bounds, this.currentFixture.text, showSlotHints);
    const existingCutTouches = this.existingCutsTouchedByPointer(slots, point, this.lastPointerPoint, this.currentCuts);
    if (this.swipe.pointInsideCutBand(slots, point)) {
      this.clearPromptAcquisitionBeat();
      this.gestureTouchedCutBand = true;
      this.clearNoCutFeedback();
      this.addTrailPoint(point.x, point.y);
    }
    const result = this.cutInput.applySample({
      bounds,
      currentCuts: this.currentCuts,
      lastPoint: this.lastPointerPoint,
      point,
      text: this.currentFixture.text,
      viewportWidth: this.scale.width,
      hinted: showSlotHints,
      playableSlots: slots
    });
    const cutsChanged = result.addedCuts.length > 0 || result.removedCuts.length > 0;
    const replacementRemovedCuts = new Set(result.replacedCuts);
    const feedbackRemovedCuts = result.removedCuts.filter((cut) => !replacementRemovedCuts.has(cut));
    const feedbackAddedCuts = result.replacedCuts.length > 0 ? [] : result.addedCuts;
    const correctionCutCount = result.replacedCuts.length > 0 ? result.addedCuts.length : 0;
    const responseCutCount = feedbackAddedCuts.length + correctionCutCount;
    this.currentCuts = result.cuts;
    this.lastPointerPoint = result.lastPoint;
    this.renderArmedCutPreview(point, { slots });
    this.forgetActiveCutPulses(result.removedCuts);
    if (correctionCutCount > 0) {
      this.playCutCorrectionFeedback(result.replacedCuts, result.addedCuts);
    }
    if (feedbackRemovedCuts.length > 0) {
      this.playAutoRemovedCutFeedback(feedbackRemovedCuts);
      this.haptics.play("clear", this.inputModality);
    }
    const touchedExistingCuts = existingCutTouches
      .filter((cut) => !result.removedCuts.includes(cut))
      .filter((cut) => !this.gestureAddedCuts.has(cut))
      .filter((cut) => !this.gestureTouchedExistingCuts.has(cut));
    if (touchedExistingCuts.length > 0) {
      this.gestureHadCut = true;
      touchedExistingCuts.forEach((cut) => this.gestureTouchedExistingCuts.add(cut));
      this.noteActiveCutPulses(touchedExistingCuts, "confirm");
      this.renderPlayerCuts();
      this.audio.play("ui");
      this.haptics.play("confirm", this.inputModality);
      this.writePlayQaSnapshot();
    }
    if (result.addedCuts.length > 0) {
      this.gestureHadCut = true;
      result.replacedCuts.forEach((cut) => this.gestureAddedCuts.delete(cut));
      result.replacedCuts.forEach((cut) => this.gestureReleaseSampleCuts.delete(cut));
      result.addedCuts.forEach((cut) => this.gestureAddedCuts.add(cut));
      if (options.releaseSample) {
        result.addedCuts.forEach((cut) => this.gestureReleaseSampleCuts.add(cut));
      }
      this.noteActiveCutPulses(result.addedCuts);
      if (responseCutCount > 0) {
        this.inputFeelMetrics.recordCutsAdded({
          nowMs: this.baseNowMs(),
          cutCount: responseCutCount,
          gestureCutCount: this.gestureAddedCuts.size,
          releaseSample: options.releaseSample,
          correction: correctionCutCount > 0
        });
      }
      if (feedbackAddedCuts.length > 0) {
        this.playPetReaction(wienerCutReaction(feedbackAddedCuts.length));
      }
      if (feedbackAddedCuts.length >= 2) {
        this.playChainSwipeFeedback(feedbackAddedCuts);
      }
      if (responseCutCount > 0) {
        this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);
        if (correctionCutCount > 0) {
          this.haptics.play("confirm", this.inputModality);
        } else {
          this.haptics.playCutBurst(responseCutCount, this.inputModality);
        }
      }
    }
    if (cutsChanged) {
      if (previousCutCount === 0 && this.currentCuts.length > 0) {
        this.startResolveReadyPulse();
      } else if (this.currentCuts.length === 0) {
        this.resolveReadyPulseStartedAt = undefined;
      }
      this.renderPlayerCuts();
      this.renderCutStatus();
      this.updateResolveButtonState();
      this.updateClearButtonState();
      this.refreshAssistantArtifact();
      this.refreshTrainingFooter();
      this.writePlayQaSnapshot();
    }
    if (result.addedCuts.length > 0) {
      this.playTextCutImpact(Math.max(1, responseCutCount));
    }
  }

  private renderHoverCutPreview(point: Point, modality: PlaytestInputModality): void {
    if (modality === "mouse" || modality === "pen") {
      this.renderArmedCutPreview(point, { trackGesturePreview: false });
      return;
    }

    this.clearArmedCutPreview();
  }

  private handlePointerGestureEnd(pointer?: Phaser.Input.Pointer): void {
    if (!this.resolving && this.currentFixture && this.lastPointerPoint && pointer) {
      const observedModality = inputModalityFromPointer(pointer);
      this.inputModality = mergeInputModality(this.inputModality, observedModality);
      this.applyPointerCutSample({ x: pointer.x, y: pointer.y }, { releaseSample: true });
    }

    const releasePoint = this.lastPointerPoint;
    const noCutPreview = this.gestureNoCutPreview;
    const shouldShowNoCutFeedback = !this.resolving && shouldAcknowledgeNoCutGesture({
      touchedCutBand: this.gestureTouchedCutBand,
      hadCut: this.gestureHadCut,
      trailPointCount: this.trailPoints.length,
      hadPreviewTarget: noCutPreview !== undefined
    });
    const currentCutSet = new Set(this.currentCuts);
    const releasePulseCuts = [...this.gestureAddedCuts].filter((cut) => currentCutSet.has(cut));
    const releaseSamplePulseCuts = [...this.gestureReleaseSampleCuts].filter((cut) => currentCutSet.has(cut));
    const normalReleasePulseCuts = releasePulseCuts.filter((cut) => !this.gestureReleaseSampleCuts.has(cut));
    if (!this.resolving && releasePulseCuts.length > 0) {
      this.noteActiveCutPulses(normalReleasePulseCuts);
      this.noteActiveCutPulses(releaseSamplePulseCuts, "release");
      this.renderPlayerCuts();
    }
    this.gestureTouchedCutBand = false;
    this.gestureHadCut = false;
    this.gestureAddedCuts.clear();
    this.gestureReleaseSampleCuts.clear();
    this.gestureTouchedExistingCuts.clear();
    this.gestureNoCutPreview = undefined;
    this.lastPointerPoint = this.cutInput.endGesture();
    this.clearArmedCutPreview();
    if (shouldShowNoCutFeedback) {
      this.inputFeelMetrics.recordNoCutAcknowledgement(noCutFeedbackReason(noCutPreview !== undefined));
      this.playNoCutFeedback(releasePoint, noCutPreview);
    }
    this.inputFeelMetrics.endGesture();
    this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));
    if (!this.resolving && releasePulseCuts.length >= 2) {
      this.playChainSwipeFeedback(releasePulseCuts);
    }
    this.writePlayQaSnapshot();
    this.trailFadeTween?.stop();
    this.trailFadeTween = this.tweens.add({
      targets: this.trailGraphics,
      alpha: 0,
      duration: SWIPE_TRAIL_FADE_MS,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.clearTrail();
        this.trailGraphics.setAlpha(1);
        this.trailFadeTween = undefined;
      }
    });
  }

  private existingCutsTouchedByPointer(
    slots: BoundarySlot[],
    point: Point,
    lastPoint: Point | undefined,
    currentCuts: number[]
  ): number[] {
    if (currentCuts.length === 0) {
      return [];
    }

    const existingCuts = new Set(currentCuts);
    const snapDistance = this.swipe.snapDistanceForViewport(this.scale.width);
    const touchedCuts = new Set<number>();
    const nearestBoundary = this.swipe.nearestBoundary(slots, point, snapDistance);
    if (nearestBoundary !== null && existingCuts.has(nearestBoundary)) {
      touchedCuts.add(nearestBoundary);
    }

    if (lastPoint) {
      for (const crossedBoundary of this.swipe.boundariesCrossedBySegment(slots, lastPoint, point, snapDistance)) {
        if (existingCuts.has(crossedBoundary)) {
          touchedCuts.add(crossedBoundary);
        }
      }
    }

    return [...touchedCuts].sort((a, b) => a - b);
  }

  private resolveRound(trigger: RoundResolveTrigger = "manual"): void {
    if (!this.currentFixture || this.resolving) {
      return;
    }

    this.resolving = true;
    this.lastResolveTrigger = trigger;
    this.tutorialReviewReady = false;
    this.tutorialReviewReadyAtMs = null;
    this.focusPauseRequested = false;
    this.lastPointerPoint = this.cutInput.endGesture();
    this.inputFeelMetrics.recordResolveCommit(this.baseNowMs());
    this.inputFeelMetrics.endGesture();
    this.gestureTouchedCutBand = false;
    this.gestureHadCut = false;
    this.gestureAddedCuts.clear();
    this.gestureReleaseSampleCuts.clear();
    this.gestureTouchedExistingCuts.clear();
    this.gestureNoCutPreview = undefined;
    this.hideActiveTrail();
    this.clearTextCutImpact();
    this.clearClearCutFeedback();
    this.clearChainSwipeFeedback();
    this.clearNoCutFeedback();
    this.clearPromptAcquisitionBeat();
    this.resolveReadyPulseStartedAt = undefined;
    this.updateResolveButtonState();
    this.updateClearButtonState();
    const now = this.nowMs();
    this.tutorialPromptTimer?.remove(false);
    this.tutorialMechanicsTimer?.remove(false);
    this.tutorialByteTimer?.remove(false);
    this.tutorialTokenIdTimer?.remove(false);
    this.tutorialRuleTimer?.remove(false);
    this.tutorialFollowupTimer?.remove(false);
    this.hideTutorialPopup();
    this.hideRobotToast();
    this.clearReviewRevealTimers();
    const timeRemainingRatio =
      this.activeRoundDurationMs <= 0 ? 0 : this.remainingTimeMs(now) / this.activeRoundDurationMs;
    const score = this.scoring.scoreRound({
      truth: this.currentFixture.boundary_positions,
      guesses: this.currentCuts,
      tier: this.currentFixture.tier,
      difficultyWeight: this.currentFixture.difficulty_weight * this.currentDifficulty.penaltyScale,
      tokenCount: this.currentFixture.token_count,
      timeRemainingRatio
    });

    this.totalCorrect += score.correctCuts.length;
    this.totalMissed += score.missedCuts.length;
    this.totalFalse += score.falseCuts.length;
    this.totalPossible += this.currentFixture.boundary_positions.length;
    this.totalPay += score.pay;
    this.totalCost += score.companyCost;
    this.lastPay = score.pay;
    this.lastCost = score.companyCost;
    this.balance += score.net;
    this.startHudImpact(score.net, now);
    this.refreshAssistantArtifact();
    this.refreshTrainingFooter();
    this.recordRoundTrace(this.currentFixture, score);
    this.updateHud(now);
    this.updateTimerVisual(now);
    this.moveSentenceToReviewPosition();
    this.renderResolvedCuts(score);
    this.playResolveCommitBeat(this.currentCuts, trigger);
    this.playPetReaction(wienerResolveReaction({
      missedCuts: score.missedCuts.length,
      falseCuts: score.falseCuts.length
    }));
    this.animateResolvedTextPieces();
    this.clearSlotHints();
    this.cutStatusText.setVisible(false);
    this.cutStatusBadgeGraphics.clear();
    this.cutStatusBadgeRect = undefined;
    this.clearInputResponseBadge();
    this.resolveReadyPulseStartedAt = undefined;
    const resolutionFeedbackInput = {
      missedCuts: score.missedCuts,
      falseCuts: score.falseCuts,
      balance: this.balance
    };
    this.audio.playSequence(this.resolutionFeedback.audioCues(resolutionFeedbackInput));
    this.haptics.play(this.resolutionFeedback.hapticCue(resolutionFeedbackInput), this.inputModality);

    const summary = this.feedback.summarize(this.currentFixture, score, { balanceAfter: this.balance });
    const baseReviewDelayMs = this.resolutionFeedback.reviewAdvanceDelayMs({
      tutorialMode: this.tutorialMode,
      finalTutorialRound: this.tutorialMode && this.tutorial.isCompleteAfter(this.round),
      category: this.currentFixture.category,
      textLength: displayLength(this.currentFixture.text),
      tokenCount: score.tokenCount,
      missedCuts: score.missedCuts,
      falseCuts: score.falseCuts
    });
    const resolutionLine = this.tutorialMode ? this.tutorialReviewSpeechFor(this.round - 1, score) : summary.overseer;
    const reviewSequence = reviewPanelSequence({
      tutorialMode: this.tutorialMode,
      compact: this.compactLayout,
      viewportHeight: this.scale.height,
      baseReviewDelayMs
    });
    this.writePlayQaSnapshot();

    this.feedbackAdvanceTimer?.remove(false);
    this.tutorialReviewPanelTimer?.remove(false);
    this.hideTutorialPopup();
    this.hideRobotToast();
    const reviewFixture = this.currentFixture;
    const reviewStartedAt = this.baseNowMs();
    const pendingReviewReveal: PendingReviewReveal = {
      fixture: reviewFixture,
      score,
      summary,
      resolutionLine,
      evidenceAtMs: reviewStartedAt + reviewSequence.evidenceDelayMs,
      feedbackAtMs: reviewStartedAt + Math.max(reviewSequence.feedbackDelayMs, reviewSequence.speechDelayMs),
      evidenceRevealed: false,
      feedbackRevealed: false
    };
    this.pendingReviewReveal = pendingReviewReveal;
    this.scheduleReviewReveal(reviewSequence.evidenceDelayMs, () => {
      this.revealReviewEvidence(pendingReviewReveal);
    });
    this.scheduleReviewReveal(Math.max(reviewSequence.feedbackDelayMs, reviewSequence.speechDelayMs), () => {
      this.revealReviewFeedback(pendingReviewReveal);
    });
    if (this.tutorialMode) {
      this.writePlayQaSnapshot();
      return;
    }

    this.feedbackAdvanceTimer = this.time.delayedCall(reviewSequence.reviewDelayMs, () => {
      this.advanceAfterResolution();
    });
  }

  private handleResolvePointerDown(): void {
    this.resolvePointerDownCanAdvanceReview =
      !this.tutorialMode || !this.resolving || this.tutorialReviewCanAdvance();
    this.applyResolveButtonVisualState(true, true);
  }

  private handleResolvePointerUp(): void {
    const canAdvanceReview = this.resolvePointerDownCanAdvanceReview;
    this.resolvePointerDownCanAdvanceReview = true;
    this.handleResolveButton({ canAdvanceReview });
  }

  private handleResolveButton(options: { canAdvanceReview?: boolean } = {}): void {
    if (this.tutorialMode && this.resolving) {
      if (options.canAdvanceReview === false) {
        this.updateResolveButtonState();
        return;
      }

      this.advanceTutorialReview();
      return;
    }

    this.resolveRound("manual");
  }

  private handleKeyboardResolve(event: KeyboardEvent): void {
    this.consumeKeyboardControl(event);
    if (event.repeat) {
      return;
    }

    this.handleResolveButton();
  }

  private handleKeyboardClear(event: KeyboardEvent): void {
    this.consumeKeyboardControl(event);
    if (event.repeat) {
      return;
    }

    this.clearPlayerCuts();
  }

  private handleKeyboardMute(event: KeyboardEvent): void {
    this.consumeKeyboardControl(event);
    if (event.repeat) {
      return;
    }

    this.toggleMute();
  }

  private handleKeyboardExit(event: KeyboardEvent): void {
    this.consumeKeyboardControl(event);
    if (event.repeat) {
      return;
    }

    this.exitToMenu();
  }

  private consumeKeyboardControl(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private markTutorialReviewReady(): void {
    this.tutorialReviewReady = true;
    this.tutorialReviewReadyAtMs = null;
    this.updateResolveButtonState();
    this.writePlayQaSnapshot();
  }

  private scheduleTutorialReviewReady(): void {
    this.tutorialReviewReady = false;
    this.tutorialReviewReadyAtMs = this.baseNowMs() + TUTORIAL_REVIEW_CONTINUE_DWELL_MS;
    this.updateResolveButtonState();
  }

  private updateTutorialReviewReady(): void {
    if (!this.tutorialMode || !this.resolving || this.tutorialReviewReady || this.tutorialReviewReadyAtMs === null) {
      return;
    }

    if (this.baseNowMs() < this.tutorialReviewReadyAtMs) {
      return;
    }

    this.markTutorialReviewReady();
  }

  private advanceTutorialReview(): void {
    if (!this.tutorialReviewCanAdvance()) {
      return;
    }

    this.advanceAfterResolution();
  }

  private tutorialReviewCanAdvance(): boolean {
    this.updateTutorialReviewReady();
    return this.tutorialReviewReady;
  }

  private advanceAfterResolution(): void {
    const transition = this.sessionFlow.afterResolution({
      tutorialMode: this.tutorialMode,
      completedRound: this.round,
      tutorialRoundCount: this.tutorial.count(),
      balance: this.balance
    });

    if (transition.type === "menu") {
      this.scene.start("MenuScene");
      return;
    }

    if (transition.type === "results") {
      this.endSession(transition.outcome);
      return;
    }

    if (transition.type === "tutorialComplete") {
      this.scene.start("TutorialCompleteScene", this.tutorialCompletePerformance());
      return;
    }

    this.startRound();
  }

  private endSession(outcome: SessionOutcome): void {
    this.feedbackAdvanceTimer?.remove(false);
    this.clearReviewRevealTimers();
    this.clearResolutionRevealTimers();
    this.clearTextCutImpact();
    this.clearResolveCommitBeat();
    this.clearClearCutFeedback();
    this.clearChainSwipeFeedback();
    this.clearPromptAcquisitionBeat();
    const completedRounds = this.sessionFlow.completedRounds({
      outcome,
      currentRound: this.round,
      resolving: this.resolving
    });
    const accuracy = this.totalPossible === 0 ? 0 : this.totalCorrect / this.totalPossible;
    const rank = this.rankSystem.calculate({
      rounds: completedRounds,
      balance: Math.max(0, this.balance),
      accuracy,
      totalPay: this.totalPay,
      totalCost: this.totalCost
    });
    this.scene.start("ResultsScene", {
      rounds: completedRounds,
      balance: Math.max(0, this.balance),
      accuracy,
      totalCorrectCuts: this.totalCorrect,
      totalMissedCuts: this.totalMissed,
      totalFalseCuts: this.totalFalse,
      startSource: this.startSource,
      inputModality: this.inputModality,
      totalPay: this.totalPay,
      totalCost: this.totalCost,
      roundTraces: this.roundTraces,
      rank: rank.rank,
      rankScore: rank.rankScore,
      costEfficiency: rank.costEfficiency,
      outcome
    });
  }

  private renderPlayerCuts(): void {
    if (!this.currentFixture) {
      return;
    }

    const fixture = this.currentFixture;
    const bounds = this.textObject.getBounds();
    const length = displayLength(fixture.text);
    const cuts = this.currentCuts
      .map((cut) => ({
        boundary: cut,
        x: cut > 0 && cut < length ? this.swipe.boundaryX(bounds, fixture.text, cut) : null
      }))
      .filter((cut): cut is { boundary: number; x: number } => cut.x !== null);
    const visibleBoundaries = new Set(cuts.map((cut) => cut.boundary));
    const now = this.baseNowMs();
    this.pruneExpiredActiveCutPulses(now);
    const lineTop = bounds.centerY - (bounds.height + 34) / 2;
    const lineBottom = bounds.centerY + (bounds.height + 34) / 2;

    this.activeCutGraphics.clear();
    for (const cut of cuts) {
      const pulse = this.activeCutPulseStartedAt.get(cut.boundary);
      const style = activeCutMarkerStyle(
        pulse === undefined ? undefined : now - pulse.startedAt,
        this.compactLayout,
        pulse?.kind ?? "new"
      );
      const markerColor = pulse?.kind === "confirm"
        ? uiPalette.oxidizedGreen
        : pulse?.kind === "release"
          ? uiPalette.amberLight
          : uiPalette.amber;
      if (style.haloAlpha > 0) {
        this.activeCutGraphics.lineStyle(style.haloWidth, markerColor, style.haloAlpha);
        this.activeCutGraphics.lineBetween(cut.x, lineTop, cut.x, lineBottom);
        this.activeCutGraphics.fillStyle(markerColor, style.capAlpha);
        this.activeCutGraphics.fillCircle(cut.x, lineTop, style.capRadius);
        this.activeCutGraphics.fillCircle(cut.x, lineBottom, style.capRadius);
      }

      this.activeCutGraphics.lineStyle(style.lineWidth, markerColor, style.lineAlpha);
      this.activeCutGraphics.lineBetween(cut.x, lineTop, cut.x, lineBottom);
    }
    this.scheduleActiveCutPulseRedraw();

    if (!shouldShowActiveCutLabels(cuts.length) || !activeCutLabelsHaveRoom(cuts.map((cut) => cut.x), activeCutLabelMinGap(this.compactLayout))) {
      this.activeCutLabels.forEach((entry) => entry.label.destroy());
      this.activeCutLabels = [];
      return;
    }

    this.activeCutLabels = this.activeCutLabels.filter((entry) => {
      if (visibleBoundaries.has(entry.boundary)) {
        return true;
      }

      entry.label.destroy();
      return false;
    });

    for (const cut of cuts) {
      const existing = this.activeCutLabels.find((entry) => entry.boundary === cut.boundary);
      const labelText = activeCutLabelText(this.activeCutPulseStartedAt.get(cut.boundary)?.kind);
      const label = existing?.label ?? this.add.text(cut.x, bounds.top - 18, labelText, {
        fontFamily: uiFonts.body,
        fontSize: "10px",
        color: uiPalette.text,
        backgroundColor: "#ded7c7"
      }).setOrigin(0.5).setDepth(13);

      label.setText(labelText);
      label.setPosition(cut.x, bounds.top - 18);
      if (!existing) {
        this.activeCutLabels.push({ boundary: cut.boundary, label });
      }
    }
  }

  private recordRoundTrace(fixture: TokenFixture, score: RoundScoreResult): void {
    const inputFeel = this.inputFeelMetrics.snapshot(this.baseNowMs());
    this.roundTraces.push({
      round: this.round,
      fixtureId: fixture.id,
      category: fixture.category,
      tier: fixture.tier,
      tokenCount: score.tokenCount,
      correctCuts: score.correctCuts.length,
      missedCuts: score.missedCuts.length,
      falseCuts: score.falseCuts.length,
      inputFeel: {
        sampleCount: inputFeel.sampleCount,
        cutCount: inputFeel.cutCount,
        firstCutLatencyMs: inputFeel.firstCutLatencyMs,
        resolveAfterFirstCutMs: inputFeel.resolveAfterFirstCutMs,
        resolveAfterLastCutMs: inputFeel.resolveAfterLastCutMs,
        lastCutBatchCount: inputFeel.lastCutBatchCount,
        lastCutWasReleaseSample: inputFeel.lastCutWasReleaseSample,
        lastCutWasCorrection: inputFeel.lastCutWasCorrection,
        releaseSampleCutCount: inputFeel.releaseSampleCutCount,
        correctionCutCount: inputFeel.correctionCutCount,
        lastGestureSampleCount: inputFeel.lastGestureSampleCount,
        lastGestureCutCount: inputFeel.lastGestureCutCount,
        resolveCommitCount: inputFeel.resolveCommitCount,
        noCutAcknowledgementCount: inputFeel.noCutAcknowledgementCount,
        nearSlotNoCutAcknowledgementCount: inputFeel.nearSlotNoCutAcknowledgementCount,
        noSlotAcknowledgementCount: inputFeel.noSlotAcknowledgementCount,
        touchAimLoupeSampleCount: inputFeel.touchAimLoupeSampleCount,
        touchAimLoupeSnapReadyCount: inputFeel.touchAimLoupeSnapReadyCount,
        touchAimLoupeUnsafeClearanceCount: inputFeel.touchAimLoupeUnsafeClearanceCount,
        touchAimLoupeMinClearancePx: inputFeel.touchAimLoupeMinClearancePx
      }
    });
  }

  private renderArmedCutPreview(point: Point, options: { trackGesturePreview?: boolean; slots?: BoundarySlot[] } = {}): void {
    if (!this.currentFixture || this.resolving) {
      this.clearArmedCutPreview();
      return;
    }

    const bounds = this.textObject.getBounds();
    const slots = options.slots ?? this.swipe.buildPlayableSlots(bounds, this.currentFixture.text, this.shouldShowSlotHints());
    const slot = this.swipe.nearestPreviewSlot(slots, point, this.currentCuts, this.scale.width);
    const previewDistance = this.swipe.previewDistanceForViewport(this.scale.width);
    const snapDistance = this.swipe.snapDistanceForViewport(this.scale.width);
    const style = slot
      ? armedCutPreviewStyle(Math.abs(point.x - slot.x), previewDistance, this.compactLayout, snapDistance)
      : undefined;
    const loupe = touchAimLoupeState({
      compact: this.compactLayout,
      inputModality: this.inputModality,
      viewport: { width: this.scale.width, height: this.scale.height },
      pointer: point,
      text: this.currentFixture.text,
      textBounds: this.qaRectFromBounds(bounds),
      slot,
      snapReady: style?.snapReady ?? false
    });

    this.armedCutPreviewGraphics.clear();
    this.armedPreviewBoundary = slot?.index ?? null;
    this.armedPreviewStrength = style?.strength ?? null;
    this.armedPreviewReady = style?.snapReady ?? false;
    this.armedPreviewRect = slot
      ? {
          x: slot.x,
          y: bounds.centerY,
          width: style?.rectWidth ?? 0,
          height: bounds.height + 42
      }
      : undefined;
    if (slot && style && style.strength > 0 && options.trackGesturePreview !== false) {
      this.gestureNoCutPreview = {
        boundary: slot.index,
        x: slot.x,
        y: bounds.centerY,
        width: style.rectWidth,
        height: bounds.height + 42,
        strength: style.strength
      };
    }
    this.renderTouchAimLoupe(loupe);
    if (!slot) {
      return;
    }

    const halfHeight = (bounds.height + 42) / 2;
    const top = bounds.centerY - halfHeight;
    const bottom = bounds.centerY + halfHeight;
    const preview = style ?? armedCutPreviewStyle(previewDistance, previewDistance, this.compactLayout, snapDistance);
    const previewColor = preview.snapReady ? uiPalette.amber : uiPalette.blueGrey;
    const targetColor = preview.snapReady ? uiPalette.amber : uiPalette.blueGrey;
    this.armedCutPreviewGraphics.fillStyle(uiPalette.coldGlass, preview.guideAlpha);
    this.armedCutPreviewGraphics.fillRect(slot.x - preview.guideWidth / 2, top, preview.guideWidth, bottom - top);
    this.armedCutPreviewGraphics.lineStyle(preview.lineWidth, previewColor, preview.lineAlpha);
    this.armedCutPreviewGraphics.lineBetween(slot.x, top, slot.x, bottom);
    this.armedCutPreviewGraphics.fillStyle(targetColor, preview.targetAlpha);
    this.armedCutPreviewGraphics.fillCircle(slot.x, bounds.centerY, preview.targetRadius);
    this.armedCutPreviewGraphics.lineStyle(1.25, targetColor, preview.targetAlpha);
    this.armedCutPreviewGraphics.lineBetween(slot.x - preview.tickLength, top, slot.x + preview.tickLength, top);
    this.armedCutPreviewGraphics.lineBetween(slot.x - preview.tickLength, bottom, slot.x + preview.tickLength, bottom);
    if (preview.snapReady && preview.latchLength > 0) {
      const latchInset = this.compactLayout ? 7 : 9;
      const latchTop = top + latchInset;
      const latchBottom = bottom - latchInset;
      const latchLeft = slot.x - preview.latchLength;
      const latchRight = slot.x + preview.latchLength;
      this.armedCutPreviewGraphics.lineStyle(preview.latchWidth + 2, uiPalette.amberLight, preview.latchAlpha * 0.32);
      this.armedCutPreviewGraphics.lineBetween(latchLeft, latchTop, slot.x, latchTop);
      this.armedCutPreviewGraphics.lineBetween(slot.x, latchBottom, latchRight, latchBottom);
      this.armedCutPreviewGraphics.lineStyle(preview.latchWidth, uiPalette.amber, preview.latchAlpha);
      this.armedCutPreviewGraphics.lineBetween(latchLeft, latchTop, slot.x, latchTop);
      this.armedCutPreviewGraphics.lineBetween(slot.x, latchBottom, latchRight, latchBottom);
    }
  }

  private renderTouchAimLoupe(state: TouchAimLoupeState): void {
    this.touchAimLoupeGraphics.clear();
    this.touchAimLoupeBoundary = state.boundary;
    this.touchAimLoupeRect = state.rect;
    this.touchAimLoupeSnapReady = state.snapReady;
    this.touchAimLoupePointerClearancePx = state.pointerClearancePx;
    this.touchAimLoupeOcclusionSafe = state.occlusionSafe;
    this.touchAimLoupePlacement = state.placement;
    this.inputFeelMetrics.recordTouchAimLoupe({
      visible: state.visible,
      snapReady: state.snapReady,
      pointerClearancePx: state.pointerClearancePx,
      occlusionSafe: state.occlusionSafe
    });

    if (!state.visible || !state.rect) {
      this.touchAimLoupeText.setVisible(false);
      return;
    }

    const rect = state.rect;
    const left = rect.x - rect.width / 2;
    const top = rect.y - rect.height / 2;
    const accentColor = state.snapReady ? uiPalette.amber : uiPalette.blueGrey;
    const style = touchAimLoupeVisualStyle(state.snapReady);

    this.touchAimLoupeGraphics.fillStyle(uiPalette.panelLight, 0.95);
    this.touchAimLoupeGraphics.fillRoundedRect(left, top, rect.width, rect.height, 6);
    this.touchAimLoupeGraphics.lineStyle(1, uiPalette.strokeDark, style.borderAlpha);
    this.touchAimLoupeGraphics.strokeRoundedRect(left, top, rect.width, rect.height, 6);
    this.touchAimLoupeGraphics.fillStyle(accentColor, style.accentAlpha);
    this.touchAimLoupeGraphics.fillRoundedRect(left + 6, top + 5, style.sideRailWidth, rect.height - 10, 2);
    this.touchAimLoupeGraphics.fillStyle(accentColor, style.railAlpha);
    this.touchAimLoupeGraphics.fillRoundedRect(left + 16, top + rect.height - 7, rect.width - 32, style.railHeight, 2);
    this.touchAimLoupeGraphics.lineStyle(style.centerLineWidth, accentColor, style.centerLineAlpha);
    this.touchAimLoupeGraphics.lineBetween(rect.x, top + 7, rect.x, top + rect.height - 7);
    if (state.snapReady) {
      const bracketInset = 12;
      const bracketGap = 4;
      this.touchAimLoupeGraphics.lineStyle(1.25, uiPalette.amberLight, style.railAlpha * 0.86);
      this.touchAimLoupeGraphics.lineBetween(rect.x - bracketInset, top + 8, rect.x - bracketGap, top + 8);
      this.touchAimLoupeGraphics.lineBetween(rect.x + bracketGap, top + 8, rect.x + bracketInset, top + 8);
      this.touchAimLoupeGraphics.lineBetween(rect.x - bracketInset, top + rect.height - 9, rect.x - bracketGap, top + rect.height - 9);
      this.touchAimLoupeGraphics.lineBetween(rect.x + bracketGap, top + rect.height - 9, rect.x + bracketInset, top + rect.height - 9);
    }
    this.touchAimLoupeText.setText(state.text);
    this.touchAimLoupeText.setPosition(rect.x, rect.y + 1);
    this.touchAimLoupeText.setVisible(true);
  }

  private renderResolvedCuts(score: RoundScoreResult): void {
    this.clearActiveCutMarkers();
    this.clearResolutionRevealTimers();
    this.clearCutMarkers();
    const groups = this.resolutionFeedback.visualCutGroups(score);
    const labelMode = this.resolutionLabelModeForGroups(groups);
    this.resolvedCutLabelRects = [];
    this.resolutionAuditLegendRect = undefined;
    this.resolutionAuditLegendText = "";
    for (const group of groups) {
      this.drawCuts(
        group.cuts,
        group.color,
        group.label,
        group.labelOffsetY,
        group.flash,
        group.flashDurationMs,
        group.revealDelayMs,
        labelMode
      );
    }
  }

  private playResolveCommitBeat(cuts: number[], trigger: RoundResolveTrigger): void {
    const style = resolutionCommitBeatStyle(cuts.length, this.compactLayout, trigger);
    this.clearResolveCommitBeat();
    if (!style || !this.currentFixture) {
      return;
    }

    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    const cutXs = cuts
      .map((cut) => cut > 0 && cut < length ? this.swipe.boundaryX(bounds, this.currentFixture!.text, cut) : null)
      .filter((x): x is number => x !== null);
    const hasCutLines = cutXs.length > 0;
    const left = hasCutLines
      ? Math.max(bounds.left - style.bandPaddingX, Math.min(...cutXs) - style.bandPaddingX)
      : Math.max(0, bounds.left - style.bandPaddingX);
    const right = hasCutLines
      ? Math.min(bounds.right + style.bandPaddingX, Math.max(...cutXs) + style.bandPaddingX)
      : Math.min(this.scale.width, bounds.right + style.bandPaddingX);
    const top = hasCutLines
      ? bounds.centerY - bounds.height / 2 - style.bandPaddingY
      : bounds.centerY - style.bandPaddingY;
    const bottom = hasCutLines
      ? bounds.centerY + bounds.height / 2 + style.bandPaddingY
      : bounds.centerY + style.bandPaddingY;
    if (right <= left || bottom <= top) {
      return;
    }

    this.resolveCommitRect = {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      width: right - left,
      height: bottom - top
    };

    this.resolveCommitGraphics.clear();
    this.resolveCommitGraphics.setVisible(true);
    this.resolveCommitGraphics.setAlpha(1);
    this.resolveCommitText.setText(resolutionCommitBeatLabel(cutXs.length, trigger));
    this.resolveCommitText.setStyle({
      color: trigger === "deadline" ? "#8f4a3d" : uiPalette.textMuted,
      fontSize: `${this.compactLayout ? 10 : 11}px`
    });
    this.resolveCommitText.setPosition((left + right) / 2, Math.max(16, top - (this.compactLayout ? 10 : 12)));
    this.resolveCommitText.setVisible(true);
    this.resolveCommitText.setAlpha(1);
    const lineColor = trigger === "deadline" ? uiPalette.warning : uiPalette.amber;
    const haloColor = trigger === "deadline" ? uiPalette.warning : uiPalette.amberLight;
    const bandColor = trigger === "deadline" ? uiPalette.warning : uiPalette.amberLight;
    if (hasCutLines) {
      this.resolveCommitGraphics.fillStyle(bandColor, style.bandAlpha);
      this.resolveCommitGraphics.fillRoundedRect(left, top, right - left, bottom - top, 7);
      for (const x of cutXs) {
        this.resolveCommitGraphics.lineStyle(style.haloWidth, haloColor, style.haloAlpha);
        this.resolveCommitGraphics.lineBetween(x, top + 5, x, bottom - 5);
        this.resolveCommitGraphics.lineStyle(style.lineWidth, lineColor, style.lineAlpha);
        this.resolveCommitGraphics.lineBetween(x, top + 8, x, bottom - 8);
        this.resolveCommitGraphics.fillStyle(haloColor, style.lineAlpha);
        this.resolveCommitGraphics.fillCircle(x, top + 8, style.capRadius);
        this.resolveCommitGraphics.fillCircle(x, bottom - 8, style.capRadius);
      }
    } else {
      const scanY = bounds.centerY;
      this.resolveCommitGraphics.lineStyle(style.haloWidth, uiPalette.blueGrey, style.haloAlpha);
      this.resolveCommitGraphics.lineBetween(left, scanY, right, scanY);
      this.resolveCommitGraphics.lineStyle(style.lineWidth, lineColor, style.lineAlpha);
      this.resolveCommitGraphics.lineBetween(left, scanY, right, scanY);
      this.resolveCommitGraphics.fillStyle(haloColor, style.lineAlpha);
      this.resolveCommitGraphics.fillCircle(left, scanY, style.capRadius);
      this.resolveCommitGraphics.fillCircle(right, scanY, style.capRadius);
    }

    this.resolveCommitTween = this.tweens.add({
      targets: [this.resolveCommitGraphics, this.resolveCommitText],
      alpha: 0,
      duration: style.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.resolveCommitTween = undefined;
        this.resetResolveCommitGraphics();
      }
    });
  }

  private clearResolveCommitBeat(): void {
    this.resolveCommitTween?.stop();
    this.resolveCommitTween = undefined;
    this.resetResolveCommitGraphics();
  }

  private resetResolveCommitGraphics(): void {
    this.resolveCommitGraphics?.clear();
    this.resolveCommitGraphics?.setVisible(false);
    this.resolveCommitGraphics?.setAlpha(1);
    this.resolveCommitText?.setVisible(false);
    this.resolveCommitText?.setAlpha(1);
    this.resolveCommitRect = undefined;
  }

  private resolutionLabelModeForGroups(
    groups: ReturnType<ResolutionFeedbackSystem["visualCutGroups"]>
  ): ResolutionCutLabelMode {
    if (!this.currentFixture) {
      return "none";
    }

    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    return resolutionCutLabelModeForGroups({
      groups: groups.map((group) => ({
        cutXs: group.cuts
          .map((cut) => cut > 0 && cut < length ? this.swipe.boundaryX(bounds, this.currentFixture!.text, cut) : null)
          .filter((x): x is number => x !== null),
        minGap: resolutionCutLabelMinGap(group.label, this.compactLayout)
      }))
    });
  }

  private drawCuts(
    cuts: number[],
    color: number,
    label: string,
    labelOffsetY: number,
    flash: boolean,
    flashDurationMs = 120,
    revealDelayMs = 0,
    labelMode: ResolutionCutLabelMode = "all"
  ): void {
    if (!this.currentFixture || cuts.length === 0) {
      return;
    }

    if (revealDelayMs > 0) {
      const timer = this.time.delayedCall(revealDelayMs, () => {
        this.resolutionRevealTimers = this.resolutionRevealTimers.filter((pending) => pending !== timer);
        this.drawCuts(cuts, color, label, labelOffsetY, flash, flashDurationMs, 0, labelMode);
      });
      this.resolutionRevealTimers.push(timer);
      return;
    }

    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    const plannedCuts = cuts
      .map((cut) => ({
        x: cut > 0 && cut < length ? this.swipe.boundaryX(bounds, this.currentFixture!.text, cut) : null
      }))
      .filter((cut): cut is { x: number } => cut.x !== null);
    plannedCuts.forEach(({ x }, visibleIndex) => {
      const line = this.add.rectangle(x, bounds.centerY, 4, bounds.height + 34, color);
      line.setDepth(12);
      this.cutMarkers.push(line);
      const showLabel = labelMode === "all";
      const offsetY = resolutionLabelOffset(labelOffsetY, visibleIndex, this.compactLayout);
      const tag = showLabel
        ? this.add.text(line.x, bounds.top - offsetY, label, {
            fontFamily: uiFonts.body,
            fontSize: "10px",
            color: uiPalette.text,
            backgroundColor: "#ded7c7"
          }).setOrigin(0.5).setDepth(13)
        : undefined;
      if (tag) {
        this.cutMarkers.push(tag);
        this.resolvedCutLabelRects.push({
          text: label,
          rect: this.qaRectFromBounds(tag.getBounds())
        });
      }

      if (flash) {
        this.tweens.add({
          targets: tag ? [line, tag] : [line],
          alpha: 0.45,
          duration: flashDurationMs,
          yoyo: true,
          repeat: 2
        });
      }
    });
    this.writePlayQaSnapshot();
  }

  private clearCutMarkers(): void {
    this.cutMarkers.forEach((marker) => marker.destroy());
    this.cutMarkers = [];
    this.resolvedCutLabelRects = [];
    this.resolutionAuditLegendRect = undefined;
    this.resolutionAuditLegendText = "";
  }

  private animateResolvedTextPieces(): void {
    if (!this.currentFixture) {
      return;
    }

    this.clearFallingTextPieces();
    const bounds = this.textObject.getBounds();
    const fontSize = this.gameTextFontSize(this.textObject);
    const piecePlans = buildSubmittedCutTextPieces(this.currentFixture.text, this.currentCuts, bounds);
    if (piecePlans.length === 0) {
      this.textObject.setVisible(true);
      return;
    }

    this.textObject.setVisible(false);
    for (const plan of piecePlans) {
      const piece = this.add.text(plan.x, plan.y, plan.text, {
        fontFamily: uiFonts.mono,
        fontSize: `${fontSize}px`,
        color: uiPalette.text,
        align: "center"
      }).setOrigin(0.5).setDepth(FALLING_TEXT_PIECE_DEPTH);
      this.fallingTextPieces.push(piece);
      this.tweens.add({
        targets: piece,
        y: this.scale.height + 42 + plan.index * 7,
        x: piece.x + plan.fallXOffset,
        angle: plan.rotationDeg,
        alpha: 0.18,
        delay: plan.delayMs,
        duration: plan.durationMs,
        ease: "Cubic.easeIn",
        onComplete: () => {
          this.fallingTextPieces = this.fallingTextPieces.filter((candidate) => candidate !== piece);
          piece.destroy();
          this.writePlayQaSnapshot();
        }
      });
    }
    this.writePlayQaSnapshot();
  }

  private clearFallingTextPieces(): void {
    this.fallingTextPieces.forEach((piece) => {
      this.tweens.killTweensOf(piece);
      piece.destroy();
    });
    this.fallingTextPieces = [];
  }

  private clearResolutionRevealTimers(): void {
    this.resolutionRevealTimers.forEach((timer) => timer.remove(false));
    this.resolutionRevealTimers = [];
  }

  private clearReviewRevealTimers(): void {
    this.reviewRevealTimers.forEach((timer) => timer.remove(false));
    this.reviewRevealTimers = [];
    this.pendingReviewReveal = undefined;
    this.tutorialReviewReadyAtMs = null;
  }

  private scheduleReviewReveal(delayMs: number, action: () => void): void {
    const normalizedDelayMs = Math.max(0, Math.floor(delayMs));
    const timer = this.time.delayedCall(normalizedDelayMs, () => {
      this.reviewRevealTimers = this.reviewRevealTimers.filter((pending) => pending !== timer);
      action();
    });
    this.reviewRevealTimers.push(timer);
  }

  private isStillReviewingFixture(fixture: TokenFixture): boolean {
    return this.resolving && this.currentFixture === fixture;
  }

  private updatePendingReviewReveal(): void {
    const pending = this.pendingReviewReveal;
    if (!pending || !this.isStillReviewingFixture(pending.fixture)) {
      return;
    }

    const now = this.baseNowMs();
    if (!pending.evidenceRevealed && now >= pending.evidenceAtMs) {
      this.revealReviewEvidence(pending);
    }

    if (!pending.feedbackRevealed && now >= pending.feedbackAtMs) {
      this.revealReviewFeedback(pending);
    }
  }

  private revealReviewEvidence(pending: PendingReviewReveal): void {
    if (pending.evidenceRevealed || !this.isStillReviewingFixture(pending.fixture)) {
      return;
    }

    pending.evidenceRevealed = true;
    this.showTokenStrip(pending.fixture, pending.score);
    this.writePlayQaSnapshot();
  }

  private revealReviewFeedback(pending: PendingReviewReveal): void {
    if (pending.feedbackRevealed || !this.isStillReviewingFixture(pending.fixture)) {
      return;
    }

    if (!pending.evidenceRevealed) {
      this.revealReviewEvidence(pending);
    }

    pending.feedbackRevealed = true;
    this.feedbackCard.show(pending.summary);
    if (this.tutorialMode) {
      this.scheduleTutorialReviewReady();
    }
    this.setRobotComment(pending.resolutionLine, {
      sticky: this.tutorialMode,
      maxLength: this.tutorialMode ? this.tutorialReviewSpeechMaxLength() : undefined
    });
    if (this.pendingReviewReveal === pending) {
      this.pendingReviewReveal = undefined;
    }
    this.writePlayQaSnapshot();
  }

  private noteActiveCutPulses(cuts: number[], kind: ActiveCutPulseKind = "new"): void {
    if (cuts.length === 0) {
      return;
    }

    const now = this.baseNowMs();
    cuts.forEach((cut) => this.activeCutPulseStartedAt.set(cut, { startedAt: now, kind }));
    this.scheduleActiveCutPulseRedraw();
  }

  private forgetActiveCutPulses(cuts: number[]): void {
    cuts.forEach((cut) => this.activeCutPulseStartedAt.delete(cut));
    if (this.activeCutPulseStartedAt.size === 0) {
      this.activeCutPulseTimer?.remove(false);
      this.activeCutPulseTimer = undefined;
    }
  }

  private pruneExpiredActiveCutPulses(now: number): void {
    const currentCutSet = new Set(this.currentCuts);
    for (const [cut, pulse] of this.activeCutPulseStartedAt) {
      if (!currentCutSet.has(cut) || now - pulse.startedAt >= ACTIVE_CUT_PULSE_MS) {
        this.activeCutPulseStartedAt.delete(cut);
      }
    }
  }

  private scheduleActiveCutPulseRedraw(): void {
    if (this.resolving || this.activeCutPulseTimer || this.activeCutPulseStartedAt.size === 0) {
      return;
    }

    this.activeCutPulseTimer = this.time.delayedCall(40, () => {
      this.activeCutPulseTimer = undefined;
      if (!this.currentFixture) {
        this.clearActiveCutPulses();
        return;
      }

      this.pruneExpiredActiveCutPulses(this.baseNowMs());
      this.renderPlayerCuts();
      this.scheduleActiveCutPulseRedraw();
    });
  }

  private clearActiveCutPulses(): void {
    this.activeCutPulseTimer?.remove(false);
    this.activeCutPulseTimer = undefined;
    this.activeCutPulseStartedAt.clear();
  }

  private clearActiveCutMarkers(): void {
    this.clearActiveCutPulses();
    this.activeCutGraphics?.clear();
    this.clearArmedCutPreview();
    this.activeCutLabels.forEach((entry) => entry.label.destroy());
    this.activeCutLabels = [];
  }

  private playClearCutFeedback(cuts: number[]): void {
    const style = clearCutFeedbackStyle(cuts.length, this.compactLayout);
    this.playCutReleaseFeedback(cuts, style);
  }

  private playAutoRemovedCutFeedback(cuts: number[]): void {
    const style = autoReleaseCutFeedbackStyle(cuts.length, this.compactLayout);
    this.playCutReleaseFeedback(cuts, style);
  }

  private playCutCorrectionFeedback(fromCuts: number[], toCuts: number[]): void {
    const pairCount = Math.min(fromCuts.length, toCuts.length);
    const style = cutCorrectionFeedbackStyle(pairCount, this.compactLayout);
    if (!style || !this.currentFixture || this.resolving) {
      this.clearClearCutFeedback();
      return;
    }

    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    const pairs = fromCuts.slice(0, pairCount).map((fromCut, index) => {
      const toCut = toCuts[index];
      if (fromCut <= 0 || fromCut >= length || toCut <= 0 || toCut >= length) {
        return null;
      }

      const fromX = this.swipe.boundaryX(bounds, this.currentFixture!.text, fromCut);
      const toX = this.swipe.boundaryX(bounds, this.currentFixture!.text, toCut);
      return fromX !== null && toX !== null && Number.isFinite(fromX) && Number.isFinite(toX)
        ? { fromX, toX }
        : null;
    }).filter((pair): pair is { fromX: number; toX: number } => pair !== null);

    if (pairs.length === 0) {
      this.clearClearCutFeedback();
      return;
    }

    this.clearClearCutFeedback();
    const bridgeY = bounds.centerY + bounds.height / 2 + (this.compactLayout ? 16 : 18);
    this.clearCutFeedbackGraphics.setAlpha(1);
    this.clearCutFeedbackGraphics.lineStyle(style.haloWidth, uiPalette.blueGrey, style.haloAlpha);
    for (const pair of pairs) {
      this.clearCutFeedbackGraphics.lineBetween(pair.fromX, bridgeY, pair.toX, bridgeY);
    }

    this.clearCutFeedbackGraphics.lineStyle(style.bridgeWidth, uiPalette.amber, style.bridgeAlpha);
    this.clearCutFeedbackGraphics.fillStyle(uiPalette.amberLight, style.endpointAlpha);
    for (const pair of pairs) {
      const direction = pair.toX >= pair.fromX ? 1 : -1;
      this.clearCutFeedbackGraphics.lineBetween(pair.fromX, bridgeY, pair.toX, bridgeY);
      this.clearCutFeedbackGraphics.fillCircle(pair.fromX, bridgeY, Math.max(1.5, style.endpointRadius * 0.66));
      this.clearCutFeedbackGraphics.fillCircle(pair.toX, bridgeY, style.endpointRadius);
      this.clearCutFeedbackGraphics.lineBetween(
        pair.toX,
        bridgeY,
        pair.toX - direction * style.arrowLength,
        bridgeY - style.arrowLength * 0.42
      );
      this.clearCutFeedbackGraphics.lineBetween(
        pair.toX,
        bridgeY,
        pair.toX - direction * style.arrowLength,
        bridgeY + style.arrowLength * 0.42
      );
    }

    const xs = pairs.flatMap((pair) => [pair.fromX, pair.toX]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    this.cutCorrectionFeedbackRect = {
      x: (minX + maxX) / 2,
      y: bridgeY,
      width: Math.max(style.haloWidth, maxX - minX + style.haloWidth + style.arrowLength),
      height: style.haloWidth + style.endpointRadius * 2 + style.arrowLength
    };
    this.writePlayQaSnapshot();

    let tween: Phaser.Tweens.Tween;
    tween = this.tweens.add({
      targets: this.clearCutFeedbackGraphics,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        if (this.clearCutFeedbackTween === tween) {
          this.clearCutFeedbackTween = undefined;
        }
        this.clearCutFeedbackGraphics.clear();
        this.clearCutFeedbackGraphics.setAlpha(1);
        this.cutCorrectionFeedbackRect = undefined;
        this.writePlayQaSnapshot();
      }
    });
    this.clearCutFeedbackTween = tween;
  }

  private playChainSwipeFeedback(cuts: number[]): void {
    const style = chainSwipeFeedbackStyle(cuts.length, this.compactLayout);
    if (!style || !this.currentFixture || this.resolving || !this.textObject.visible) {
      this.clearChainSwipeFeedback();
      return;
    }

    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    const cutXs = cuts
      .map((cut) => cut > 0 && cut < length ? this.swipe.boundaryX(bounds, this.currentFixture!.text, cut) : null)
      .filter((x): x is number => x !== null && Number.isFinite(x))
      .sort((a, b) => a - b);
    if (cutXs.length < 2) {
      this.clearChainSwipeFeedback();
      return;
    }

    this.clearChainSwipeFeedback();
    const minX = Math.min(...cutXs);
    const maxX = Math.max(...cutXs);
    const bridgeY = bounds.centerY + bounds.height / 2 + (this.compactLayout ? 9 : 11);
    const tickTop = bridgeY - style.tickLength / 2;
    const tickBottom = bridgeY + style.tickLength / 2;
    this.chainSwipeFeedbackGraphics.clear();
    this.chainSwipeFeedbackGraphics.setAlpha(1);
    this.chainSwipeFeedbackGraphics.setVisible(true);
    this.chainSwipeFeedbackGraphics.lineStyle(style.haloWidth, uiPalette.amberLight, style.haloAlpha);
    this.chainSwipeFeedbackGraphics.lineBetween(minX, bridgeY, maxX, bridgeY);
    this.chainSwipeFeedbackGraphics.lineStyle(style.railWidth, uiPalette.warning, style.railAlpha);
    this.chainSwipeFeedbackGraphics.lineBetween(minX, bridgeY, maxX, bridgeY);
    this.chainSwipeFeedbackGraphics.lineStyle(style.tickWidth, uiPalette.amber, style.tickAlpha);
    this.chainSwipeFeedbackGraphics.fillStyle(uiPalette.amberLight, style.capAlpha);
    for (const x of cutXs) {
      this.chainSwipeFeedbackGraphics.lineBetween(x, tickTop, x, tickBottom);
      this.chainSwipeFeedbackGraphics.fillCircle(x, bridgeY, style.capRadius);
    }

    this.chainSwipeFeedbackRect = {
      x: (minX + maxX) / 2,
      y: bridgeY,
      width: Math.max(style.haloWidth, maxX - minX + style.haloWidth),
      height: Math.max(style.haloWidth, style.tickLength + style.capRadius * 2)
    };
    this.writePlayQaSnapshot();

    let tween: Phaser.Tweens.Tween;
    tween = this.tweens.add({
      targets: this.chainSwipeFeedbackGraphics,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        if (this.chainSwipeFeedbackTween === tween) {
          this.chainSwipeFeedbackTween = undefined;
        }
        this.chainSwipeFeedbackGraphics.clear();
        this.chainSwipeFeedbackGraphics.setVisible(false);
        this.chainSwipeFeedbackGraphics.setAlpha(1);
        this.chainSwipeFeedbackRect = undefined;
        this.writePlayQaSnapshot();
      }
    });
    this.chainSwipeFeedbackTween = tween;
  }

  private playCutReleaseFeedback(cuts: number[], style: ClearCutFeedbackStyle | null): void {
    if (!style || !this.currentFixture || this.resolving) {
      this.clearClearCutFeedback();
      return;
    }

    this.clearClearCutFeedback();
    const bounds = this.textObject.getBounds();
    const length = displayLength(this.currentFixture.text);
    const cutXs = cuts
      .map((cut) => cut > 0 && cut < length ? this.swipe.boundaryX(bounds, this.currentFixture!.text, cut) : null)
      .filter((x): x is number => x !== null && Number.isFinite(x));

    if (cutXs.length === 0) {
      return;
    }

    const lineTop = bounds.centerY - (bounds.height + 34) / 2;
    const lineBottom = bounds.centerY + (bounds.height + 34) / 2;
    this.clearCutFeedbackGraphics.setAlpha(1);
    this.clearCutFeedbackGraphics.lineStyle(style.haloWidth, uiPalette.blueGrey, style.haloAlpha);
    for (const x of cutXs) {
      this.clearCutFeedbackGraphics.lineBetween(x, lineTop, x, lineBottom);
    }

    this.clearCutFeedbackGraphics.lineStyle(style.lineWidth, uiPalette.strokeDark, style.lineAlpha);
    this.clearCutFeedbackGraphics.fillStyle(uiPalette.strokeDark, style.capAlpha);
    for (const x of cutXs) {
      this.clearCutFeedbackGraphics.lineBetween(x, lineTop, x, lineBottom);
      this.clearCutFeedbackGraphics.fillCircle(x, lineTop, style.capRadius);
      this.clearCutFeedbackGraphics.fillCircle(x, lineBottom, style.capRadius);
    }

    const minX = Math.min(...cutXs);
    const maxX = Math.max(...cutXs);
    this.clearCutFeedbackRect = {
      x: (minX + maxX) / 2,
      y: bounds.centerY,
      width: Math.max(style.haloWidth, maxX - minX + style.haloWidth),
      height: lineBottom - lineTop + style.capRadius * 2
    };
    this.writePlayQaSnapshot();

    let tween: Phaser.Tweens.Tween;
    tween = this.tweens.add({
      targets: this.clearCutFeedbackGraphics,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        if (this.clearCutFeedbackTween === tween) {
          this.clearCutFeedbackTween = undefined;
        }
        this.clearCutFeedbackGraphics.clear();
        this.clearCutFeedbackGraphics.setAlpha(1);
        this.clearCutFeedbackRect = undefined;
        this.writePlayQaSnapshot();
      }
    });
    this.clearCutFeedbackTween = tween;
  }

  private clearClearCutFeedback(): void {
    this.clearCutFeedbackTween?.stop();
    this.clearCutFeedbackTween = undefined;
    this.clearCutFeedbackGraphics?.clear();
    this.clearCutFeedbackGraphics?.setAlpha(1);
    this.clearCutFeedbackRect = undefined;
    this.cutCorrectionFeedbackRect = undefined;
  }

  private clearChainSwipeFeedback(): void {
    this.chainSwipeFeedbackTween?.stop();
    this.chainSwipeFeedbackTween = undefined;
    this.chainSwipeFeedbackGraphics?.clear();
    this.chainSwipeFeedbackGraphics?.setVisible(false);
    this.chainSwipeFeedbackGraphics?.setAlpha(1);
    this.chainSwipeFeedbackRect = undefined;
  }

  private playNoCutFeedback(point?: Point, preview?: NoCutPreviewSnapshot): void {
    if (!this.currentFixture || this.resolving) {
      this.clearNoCutFeedback();
      return;
    }

    const reason = noCutFeedbackReason(preview !== undefined);
    const style = noCutFeedbackStyle(this.compactLayout, reason);
    const bounds = this.textObject.getBounds();
    const x = Math.max(bounds.left + 18, Math.min(bounds.right - 18, point?.x ?? bounds.centerX));
    const contactY = Math.max(bounds.top - 8, Math.min(bounds.bottom + 8, point?.y ?? bounds.centerY));
    const startY = bounds.top - 16;
    this.audio.play("miss");
    this.haptics.play("miss", this.inputModality);
    this.clearNoCutFeedback();
    this.noCutFeedbackGraphics.setPosition(0, 0);
    this.noCutFeedbackGraphics.setAlpha(1);
    this.noCutFeedbackGraphics.setVisible(true);
    if (preview) {
      const previewTop = preview.y - preview.height / 2;
      const previewBottom = preview.y + preview.height / 2;
      const guideWidth = style.snapGuideWidth + preview.strength * (this.compactLayout ? 3 : 5);
      this.noCutFeedbackGraphics.fillStyle(uiPalette.coldGlass, style.snapGuideAlpha);
      this.noCutFeedbackGraphics.fillRect(preview.x - guideWidth / 2, previewTop, guideWidth, preview.height);
      this.noCutFeedbackGraphics.lineStyle(style.snapLineWidth, uiPalette.warning, style.snapLineAlpha);
      this.noCutFeedbackGraphics.lineBetween(preview.x, previewTop, preview.x, previewBottom);
      this.noCutFeedbackGraphics.lineStyle(1, uiPalette.warning, style.snapTickAlpha);
      this.noCutFeedbackGraphics.lineBetween(preview.x - style.snapTickLength, previewTop, preview.x + style.snapTickLength, previewTop);
      this.noCutFeedbackGraphics.lineBetween(preview.x - style.snapTickLength, previewBottom, preview.x + style.snapTickLength, previewBottom);
    }
    const direction = preview ? noCutFeedbackDirection(x, preview.x) : "center";
    this.noCutFeedbackDirection = direction;
    this.noCutFeedbackGraphics.lineStyle(style.scuffHaloWidth, uiPalette.blueGrey, style.scuffHaloAlpha);
    this.noCutFeedbackGraphics.lineBetween(x - style.scuffLength / 2, contactY, x + style.scuffLength / 2, contactY);
    this.noCutFeedbackGraphics.lineStyle(style.scuffWidth, uiPalette.warning, style.scuffAlpha);
    this.noCutFeedbackGraphics.lineBetween(x - style.scuffLength / 2, contactY, x + style.scuffLength / 2, contactY);
    this.noCutFeedbackGraphics.lineStyle(Math.max(1, style.scuffWidth - 1), uiPalette.strokeDark, style.scuffAlpha * 0.58);
    this.noCutFeedbackGraphics.lineBetween(x - style.scuffLength * 0.32, contactY - 5, x + style.scuffLength * 0.22, contactY - 5);
    this.noCutFeedbackGraphics.lineBetween(x - style.scuffLength * 0.22, contactY + 5, x + style.scuffLength * 0.32, contactY + 5);
    let correctionLeft = x;
    let correctionRight = x;
    let correctionTop = contactY;
    let correctionBottom = contactY;
    if (preview && direction !== "center") {
      const arrowSign = direction === "left" ? -1 : 1;
      const arrowLength = Math.min(Math.abs(preview.x - x), style.correctionArrowLength);
      const arrowStartX = x;
      const arrowEndX = x + arrowSign * arrowLength;
      const arrowY = Math.max(bounds.top - 10, Math.min(bounds.bottom + 10, contactY));
      const arrowHead = this.compactLayout ? 4 : 5;
      this.noCutFeedbackGraphics.lineStyle(style.correctionArrowWidth + 2, uiPalette.amberLight, style.correctionArrowAlpha * 0.28);
      this.noCutFeedbackGraphics.lineBetween(arrowStartX, arrowY, arrowEndX, arrowY);
      this.noCutFeedbackGraphics.lineStyle(style.correctionArrowWidth, uiPalette.warning, style.correctionArrowAlpha);
      this.noCutFeedbackGraphics.lineBetween(arrowStartX, arrowY, arrowEndX, arrowY);
      this.noCutFeedbackGraphics.lineBetween(arrowEndX, arrowY, arrowEndX - arrowSign * arrowHead, arrowY - arrowHead);
      this.noCutFeedbackGraphics.lineBetween(arrowEndX, arrowY, arrowEndX - arrowSign * arrowHead, arrowY + arrowHead);
      correctionLeft = Math.min(arrowStartX, arrowEndX) - arrowHead;
      correctionRight = Math.max(arrowStartX, arrowEndX) + arrowHead;
      correctionTop = arrowY - arrowHead - style.correctionArrowWidth;
      correctionBottom = arrowY + arrowHead + style.correctionArrowWidth;
    }
    this.noCutFeedbackReason = reason;
    this.noCutFeedbackText.setText(noCutFeedbackLabel(reason, direction));
    this.noCutFeedbackText.setStyle({ fontSize: `${style.fontSize}px` });
    this.noCutFeedbackText.setPosition(x, startY);
    this.noCutFeedbackText.setAlpha(style.alpha);
    this.noCutFeedbackText.setVisible(true);
    const textBounds = this.noCutFeedbackText.getBounds();
    const scuffLeft = x - (style.scuffLength + style.scuffHaloWidth) / 2;
    const scuffRight = x + (style.scuffLength + style.scuffHaloWidth) / 2;
    const scuffTop = contactY - style.scuffHaloWidth / 2 - 7;
    const scuffBottom = contactY + style.scuffHaloWidth / 2 + 7;
    const previewLeft = preview ? preview.x - (style.snapGuideWidth + preview.strength * (this.compactLayout ? 3 : 5)) / 2 : scuffLeft;
    const previewRight = preview ? preview.x + (style.snapGuideWidth + preview.strength * (this.compactLayout ? 3 : 5)) / 2 : scuffRight;
    const previewTop = preview ? preview.y - preview.height / 2 : scuffTop;
    const previewBottom = preview ? preview.y + preview.height / 2 : scuffBottom;
    const left = Math.min(textBounds.left, scuffLeft, previewLeft, correctionLeft);
    const right = Math.max(textBounds.right, scuffRight, previewRight, correctionRight);
    const top = Math.min(textBounds.top, scuffTop, previewTop, correctionTop);
    const bottom = Math.max(textBounds.bottom, scuffBottom, previewBottom, correctionBottom);
    this.noCutFeedbackRect = {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      width: right - left,
      height: bottom - top
    };
    this.writePlayQaSnapshot();
    this.noCutFeedbackTween = this.tweens.add({
      targets: this.noCutFeedbackText,
      y: startY - style.yLift,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        this.noCutFeedbackGraphics.clear();
        this.noCutFeedbackGraphics.setPosition(0, 0);
        this.noCutFeedbackGraphics.setVisible(false);
        this.noCutFeedbackGraphics.setAlpha(1);
        this.noCutFeedbackText.setVisible(false);
        this.noCutFeedbackText.setAlpha(1);
        this.noCutFeedbackTween = undefined;
        this.noCutFeedbackRect = undefined;
        this.noCutFeedbackReason = undefined;
        this.noCutFeedbackDirection = undefined;
        this.writePlayQaSnapshot();
      }
    });
    this.noCutFeedbackScuffTween = this.tweens.add({
      targets: this.noCutFeedbackGraphics,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        this.noCutFeedbackGraphics.clear();
        this.noCutFeedbackGraphics.setPosition(0, 0);
        this.noCutFeedbackGraphics.setVisible(false);
        this.noCutFeedbackGraphics.setAlpha(1);
        this.noCutFeedbackScuffTween = undefined;
      }
    });
  }

  private clearNoCutFeedback(): void {
    this.noCutFeedbackTween?.stop();
    this.noCutFeedbackTween = undefined;
    this.noCutFeedbackScuffTween?.stop();
    this.noCutFeedbackScuffTween = undefined;
    this.noCutFeedbackGraphics?.clear();
    this.noCutFeedbackGraphics?.setPosition(0, 0);
    this.noCutFeedbackGraphics?.setVisible(false);
    this.noCutFeedbackGraphics?.setAlpha(1);
    this.noCutFeedbackText?.setVisible(false);
    this.noCutFeedbackText?.setAlpha(1);
    this.noCutFeedbackRect = undefined;
    this.noCutFeedbackReason = undefined;
    this.noCutFeedbackDirection = undefined;
  }

  private playTextCutImpact(addedCutCount: number): void {
    const style = textCutImpactStyle(addedCutCount, this.compactLayout);
    if (!style || this.resolving || !this.textObject.visible) {
      return;
    }

    this.clearTextCutImpact();
    const fontSize = this.gameTextFontSize(this.textObject);
    const ghost = this.add.text(this.textObject.x, this.textObject.y, this.textObject.text, {
      fontFamily: uiFonts.mono,
      fontSize: `${fontSize}px`,
      color: "#8f531f",
      align: "center"
    }).setOrigin(0.5).setDepth(7).setAlpha(this.compactLayout ? 0.28 : 0.34);
    ghost.setScale(style.scaleX, style.scaleY);
    this.textCutImpactGhost = ghost;
    this.writePlayQaSnapshot();
    this.textCutImpactTween = this.tweens.add({
      targets: ghost,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: style.durationMs,
      ease: style.ease,
      onComplete: () => {
        ghost.destroy();
        if (this.textCutImpactGhost === ghost) {
          this.textCutImpactGhost = undefined;
        }
        this.textCutImpactTween = undefined;
        this.writePlayQaSnapshot();
      }
    });
  }

  private clearTextCutImpact(): void {
    this.textCutImpactTween?.stop();
    this.textCutImpactTween = undefined;
    this.textCutImpactGhost?.destroy();
    this.textCutImpactGhost = undefined;
    this.textObject?.setScale(1);
  }

  private clearArmedCutPreview(): void {
    this.armedPreviewBoundary = null;
    this.armedPreviewStrength = null;
    this.armedPreviewReady = false;
    this.armedPreviewRect = undefined;
    this.armedCutPreviewGraphics?.clear();
    this.touchAimLoupeBoundary = null;
    this.touchAimLoupeRect = undefined;
    this.touchAimLoupeSnapReady = false;
    this.touchAimLoupePointerClearancePx = null;
    this.touchAimLoupeOcclusionSafe = false;
    this.touchAimLoupePlacement = "hidden";
    this.touchAimLoupeGraphics?.clear();
    this.touchAimLoupeText?.setVisible(false);
  }

  private clearSlotHints(): void {
    this.slotHintGraphics?.clear();
    this.targetHintGraphics?.clear();
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const layout = computePlayLayout({ width, height });
    const fontSize = this.fitTextFontSize(layout.textPanel.width, layout.compact);
    this.compactLayout = layout.compact;

    this.background.setSize(width, height);
    this.drawDegradedSurface(width, height, layout);
    this.layoutBrandPanel(layout);
    this.chromeBar.setVisible(false);
    const showHeaderBrand = shouldShowPlayHeaderBrand(layout);
    this.headerWienerLogo.setVisible(showHeaderBrand);
    this.headerWienerLogo.setPosition(layout.logoWiener.x, layout.logoWiener.y);
    sizeWienerImage(this.headerWienerLogo, layout.logoWiener.height);
    this.chromeText.setText("WienerWorks");
    this.chromeText.setVisible(showHeaderBrand);
    this.chromeText.setPosition(layout.chrome.x - layout.chrome.width / 2 + (layout.compact ? 38 : 46), layout.chrome.y);
    this.layoutExitButton(layout);
    this.playfield.setPosition(layout.playfield.x, layout.playfield.y);
    this.playfield.setSize(layout.playfield.width, layout.playfield.height);
    this.drawSegmentationLane(layout);
    this.layoutTrainingFooter(layout);
    this.textPanelShadow.setSize(layout.textPanel.width, layout.textPanel.height);
    this.textPanel.setSize(layout.textPanel.width, layout.textPanel.height);
    this.textPanelShadow.setVisible(false);
    this.textPanel.setVisible(false);
    this.textPanelChrome.clear();
    this.textObject.setStyle({ fontSize: `${fontSize}px` });
    this.tokenStripText.setWordWrapWidth(layout.textPanel.width - (layout.compact ? 30 : 64));
    this.timerTrack.setPosition(layout.timer.x, layout.timer.y);
    this.timerTrack.setSize(layout.timer.width, layout.timer.height);
    this.timerFill.setPosition(layout.timer.x, layout.timer.y);
    this.resolveButton.setPosition(layout.resolveButton.x, layout.resolveButton.y);
    this.resolveButton.setSize(layout.resolveButton.width, layout.resolveButton.height);
    this.resolveLabel.setPosition(this.resolveButton.x, this.resolveButton.y);
    this.updateResolveButtonState();
    this.clearButton.setPosition(layout.clearButton.x, layout.clearButton.y);
    this.clearButton.setSize(layout.clearButton.width, layout.clearButton.height);
    this.clearLabel.setPosition(this.clearButton.x, this.clearButton.y);
    this.updateClearButtonState();
    this.muteButton.setPosition(layout.muteButton.x, layout.muteButton.y);
    this.muteButton.setSize(layout.muteButton.width, layout.muteButton.height);
    this.muteLabel.setPosition(this.muteButton.x, this.muteButton.y);
    this.layoutAssistantArtifact(layout);
    this.layoutPetWiener(layout);
    this.layoutTutorialPopup();
    this.layoutRobotToast();
    this.hud.layout(width, layout.contentPanel);
    this.overseer.setVisible(false);
    this.overseer.layout(width, height, layout.overseerReservedRight);
    this.feedbackCard.layout(width, height, layout.contentPanel);
    const now = this.nowMs();
    this.updateTimerVisual(now);
    this.updateSentenceMotion(now);

    if (this.resolving) {
      return;
    }

    this.renderPlayerCuts();
  }

  private layoutTrainingFooter(layout: ReturnType<typeof computePlayLayout>): void {
    const visible = !layout.compact && layout.footerPanel.height > 0;
    this.trainingFooterGraphics.setVisible(visible);
    this.trainingFooterGlyph.setVisible(visible);
    this.trainingFooterGlyph.clear();
    this.trainingFooterTexts.forEach((entry) => {
      entry.label.setVisible(visible);
      entry.value.setVisible(visible);
    });
    this.trainingFooterGraphics.clear();

    if (!visible) {
      return;
    }

    const panel = layout.footerPanel;
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    const right = left + panel.width;
    const columnWidth = panel.width / this.trainingFooterTexts.length;

    this.trainingFooterGraphics.fillStyle(uiPalette.panelLight, 0.92);
    this.trainingFooterGraphics.fillRoundedRect(left, top, panel.width, panel.height, 6);
    this.trainingFooterGraphics.lineStyle(1, uiPalette.stroke, 0.82);
    this.trainingFooterGraphics.strokeRoundedRect(left, top, panel.width, panel.height, 6);
    this.trainingFooterGraphics.fillStyle(uiPalette.panelTint, 0.32);
    this.trainingFooterGraphics.fillRect(left + 1, top + 1, panel.width - 2, 14);
    this.trainingFooterGraphics.lineStyle(1, uiPalette.stroke, 0.52);
    for (let index = 1; index < this.trainingFooterTexts.length; index += 1) {
      const x = left + columnWidth * index;
      this.trainingFooterGraphics.lineBetween(x, top + 10, x, top + panel.height - 10);
    }
    this.trainingFooterGraphics.fillStyle(uiPalette.oxidizedGreen, 0.45);
    this.trainingFooterGraphics.fillCircle(right - 20, top + panel.height - 16, 5);
    this.trainingFooterGraphics.fillCircle(right - 34, top + panel.height - 16, 5);

    this.refreshTrainingFooter();
    this.trainingFooterTexts.forEach((entry, index) => {
      const cellLeft = left + index * columnWidth;
      const isTipCell = index === this.trainingFooterTexts.length - 1;
      const textX = cellLeft + (isTipCell ? 66 : 14);
      entry.label.setPosition(textX, top + 13);
      entry.value.setPosition(textX, top + 33);
      entry.value.setWordWrapWidth(Math.max(72, columnWidth - (isTipCell ? 78 : 28)));
    });
  }

  private refreshTrainingFooter(): void {
    if (!this.trainingFooterTexts.length) {
      return;
    }

    const nextPay = this.currentFixture
      ? Math.max(0, this.currentFixture.boundary_positions.length * 0.15).toFixed(2)
      : "0.00";
    const accuracy = this.totalPossible === 0 ? 0 : this.totalCorrect / this.totalPossible;
    const rank = this.rankSystem.calculate({
      rounds: Math.max(0, this.round - 1),
      accuracy,
      totalPay: this.totalPay,
      totalCost: this.totalCost,
      balance: Math.max(0, this.balance)
    });
    const values = [
      ["NEXT PAYOUT", `$${nextPay}\nif exact`],
      ["PENALTIES", "-$0.10 miss\n-$0.08 false"],
      ["ECONOMY", "You earn less\nthan you save."],
      ["RANK", `${rank.rank}\n${rank.rankScore.toFixed(0)} pts`],
      ["TIP", this.currentCuts.length > 0 ? "Resolve only\nwhen committed." : "Not every\nspace is a cut."]
    ];

    this.trainingFooterTexts.forEach((entry, index) => {
      const [label, value] = values[index] ?? ["", ""];
      entry.label.setText(label);
      entry.value.setText(value);
    });
  }

  private tutorialCompletePerformance(): TutorialCompletePerformance {
    return {
      accuracy: this.totalPossible === 0 ? 0 : this.totalCorrect / this.totalPossible,
      totalCorrectCuts: this.totalCorrect,
      totalMissedCuts: this.totalMissed,
      totalFalseCuts: this.totalFalse
    };
  }

  private updateHud(time: number): void {
    const progress = this.hudProgressState();
    this.hud.update({
      balance: this.balance,
      pay: this.lastPay,
      cost: this.lastCost,
      progressLabel: progress.label,
      progressCurrent: progress.current,
      progressTarget: progress.target,
      timeRemainingMs: this.remainingTimeMs(time),
      timerMode: this.resolving ? "review" : this.sentenceMotion?.paused ? "paused" : "active",
      timeWarningEnabled: !this.tutorialMode,
      highScoreRounds: this.highScoreRecord?.rounds ?? 0,
      highScoreRank: this.highScoreRecord?.rank ?? "Regex Intern",
      impact: this.currentHudImpactState(time)
    });
  }

  private hudProgressState(): { label: string; current: number; target: number } {
    if (this.tutorialMode) {
      return {
        label: "TUTORIAL",
        current: this.round,
        target: this.tutorial.count()
      };
    }

    const completedRounds = Math.max(0, this.round - (this.resolving ? 0 : 1));
    const progress = this.rankSystem.progressForCompletedRounds(completedRounds, this.resolving);
    return {
      label: "CLEARANCE",
      current: progress.current,
      target: progress.target
    };
  }

  private startHudImpact(net: number, time: number): void {
    this.hudImpactNet = net;
    this.hudImpactStartedAt = Number.isFinite(net) && net !== 0 ? time : null;
  }

  private clearHudImpact(): void {
    this.hudImpactStartedAt = null;
    this.hudImpactNet = 0;
  }

  private currentHudImpactState(time: number): HudImpactVisualState {
    return hudImpactVisualState({
      net: this.hudImpactNet,
      elapsedMs: this.hudImpactStartedAt === null ? null : time - this.hudImpactStartedAt
    });
  }

  private updateTimerVisual(time: number): void {
    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    const timerState = this.currentTimerPressureState(time);
    this.timerFill.setSize(layout.timer.width * timerState.ratio, timerState.height);
    this.timerFill.setFillStyle(
      this.resolving || this.sentenceMotion?.paused
        ? uiPalette.blueGrey
        : timerState.warningActive ? uiPalette.warning : uiPalette.amber,
      timerState.fillAlpha
    );
    this.drawTimerPressureLane(layout, timerState);
  }

  private currentTimerPressureState(time: number): TimerPressureVisualState {
    return timerPressureVisualState({
      tutorialMode: this.tutorialMode,
      resolving: this.resolving,
      paused: this.sentenceMotion?.paused,
      timeRemainingMs: this.remainingTimeMs(time),
      durationMs: this.activeRoundDurationMs,
      timeMs: time
    });
  }

  private maybePlayTimeWarning(time: number): void {
    if (shouldPlayTimeWarning({
      tutorialMode: this.tutorialMode,
      resolving: this.resolving,
      warningPlayed: this.timeWarningPlayed,
      timeRemainingMs: this.remainingTimeMs(time)
    })) {
      this.timeWarningPlayed = true;
      this.audio.play("warning");
      this.haptics.play("warning", this.inputModality);
      this.writePlayQaSnapshot();
    }
  }

  private startSentenceMotion(now = this.nowMs()): void {
    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    this.sentenceMotion = this.motion.create({
      startY: layout.sentenceStartY,
      endY: layout.sentenceEndY,
      durationMs: this.activeRoundDurationMs,
      startedAtMs: now,
      paused: false
    });
    const initialMotionNow = this.qaControls.freezeElapsedMs !== undefined ? this.nowMs() : now;
    this.updateSentenceMotion(initialMotionNow);
  }

  private updateSentenceMotion(time: number): void {
    if (!this.sentenceMotion) {
      this.setSentenceY(this.computeRestingSentenceY());
      return;
    }

    this.setSentenceY(this.motion.positionAt(this.sentenceMotion, time));
  }

  private setSentenceY(y: number): void {
    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    const panelX = layout.textPanel.x;
    this.textPanel.setPosition(panelX, y);
    this.textPanelShadow.setPosition(panelX + 5, y + 6);
    this.drawTextPanelChrome();
    this.textObject.setPosition(panelX, y);
    this.cutStatusText.setPosition(panelX, y + 39);
    this.layoutSegmentationEvidence();
    this.layoutRobotToast();
    this.layoutTutorialPopup();

    if (!this.resolving) {
      this.renderSlotHints();
      this.renderCutStatus();
      if (this.currentCuts.length > 0) {
        this.renderPlayerCuts();
      }
    }
    this.writePlayQaSnapshot();
  }

  private drawDegradedSurface(width: number, height: number, layout: ReturnType<typeof computePlayLayout>): void {
    drawDegradedBrowserSurface(this.degradationGraphics, width, height, {
      topOffset: layout.topOffset,
      bottomOffset: layout.bottomOffset,
      compact: layout.compact
    });
    if (!layout.compact) {
      const content = layout.contentPanel;
      const left = content.x - content.width / 2;
      const top = content.y - content.height / 2;

      this.degradationGraphics.fillStyle(uiPalette.panelLight, 0.42);
      this.degradationGraphics.fillRoundedRect(left, top, content.width, content.height, 6);
      this.degradationGraphics.lineStyle(1, uiPalette.stroke, 0.52);
      this.degradationGraphics.strokeRoundedRect(left, top, content.width, content.height, 6);
    }
  }

  private layoutBrandPanel(layout: ReturnType<typeof computePlayLayout>): void {
    const visible = layout.sideBrandPanel;
    this.brandPanel.setVisible(visible);
    this.brandPanelChrome.setVisible(visible);
    this.brandGlyph.setVisible(visible);
    this.brandCompanyText.setVisible(visible);
    this.brandDivisionText.setVisible(visible);
    this.brandProductText.setVisible(visible);
    this.brandPremiseText.setVisible(visible);
    this.brandLoopText.setVisible(visible);
    this.brandPanelChrome.clear();
    this.brandGlyph.clear();

    if (!visible) {
      return;
    }

    const panel = layout.brandPanel;
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    const right = left + panel.width;
    const bodyWidth = panel.width - 32;

    this.brandPanel.setPosition(panel.x, panel.y);
    this.brandPanel.setSize(panel.width, panel.height);
    this.brandPanelChrome.fillStyle(uiPalette.panelTint, 0.58);
    this.brandPanelChrome.fillRect(left + 1, top + 1, panel.width - 2, 36);
    this.brandPanelChrome.lineStyle(1, uiPalette.stroke, 0.72);
    this.brandPanelChrome.lineBetween(left + 14, top + 168, right - 14, top + 168);
    this.brandPanelChrome.lineBetween(left + 14, top + 326, right - 14, top + 326);
    this.brandPanelChrome.lineBetween(left + 14, top + 430, right - 14, top + 430);
    this.brandPanelChrome.fillStyle(uiPalette.amber, 0.5);
    this.brandPanelChrome.fillRect(left + 1, top + 1, 4, panel.height - 2);
    this.brandPanelChrome.fillStyle(uiPalette.oxidizedGreen, 0.54);
    this.brandPanelChrome.fillCircle(right - 30, top + 452, 5);
    this.brandPanelChrome.fillCircle(right - 16, top + 452, 5);

    this.brandCompanyText.setPosition(left + 88, top + 42);
    this.brandDivisionText.setPosition(left + 90, top + 86);
    this.brandProductText.setPosition(left + 90, top + 120);
    this.brandPremiseText.setText(
      [
        "Inference margin exceeded route tolerance.",
        "Human segmentation assigned.",
        "Predict token boundaries.",
        "Accuracy extends the shift."
      ].join("\n")
    );
    this.brandPremiseText.setPosition(left + 18, top + 190);
    this.brandPremiseText.setWordWrapWidth(bodyWidth);
    this.brandLoopText.setText(
      [
      "THE LOOP",
      "Text scrolls in   ->   You slice",
      "System audits    ->   You survive",
      "",
      "HELP: DISABLED",
      "MODEL ROUTE: HUMAN",
      "BALANCE WINDOW: OPEN"
      ].join("\n")
    );
    this.brandLoopText.setPosition(left + 18, top + 352);
    this.brandLoopText.setWordWrapWidth(bodyWidth);
  }

  private drawSegmentationLane(layout: ReturnType<typeof computePlayLayout>): void {
    const playfield = layout.playfield;
    const left = playfield.x - playfield.width / 2;
    const top = playfield.y - playfield.height / 2;
    const bottom = playfield.y + playfield.height / 2;
    const laneWidth = Math.min(playfield.width - 28, layout.textPanel.width + (layout.compact ? 34 : 92));
    const laneLeft = playfield.x - laneWidth / 2;
    const laneRight = playfield.x + laneWidth / 2;
    const promptY = layout.sentenceActiveY;
    const tickHeight = layout.compact ? 28 : 34;

    this.segmentationLaneGraphics.clear();
    this.segmentationLaneGraphics.lineStyle(1, uiPalette.strokeDark, 0.12);
    this.segmentationLaneGraphics.lineBetween(laneLeft, promptY + 43, laneRight, promptY + 43);
    this.segmentationLaneGraphics.lineStyle(1, uiPalette.scanline, 0.32);
    this.segmentationLaneGraphics.lineBetween(laneLeft, promptY - 43, laneRight, promptY - 43);

    this.segmentationLaneGraphics.lineStyle(1, uiPalette.grid, 0.24);
    for (let x = laneLeft + 32; x < laneRight - 20; x += layout.compact ? 48 : 64) {
      this.segmentationLaneGraphics.lineBetween(x, promptY - tickHeight, x, promptY + tickHeight);
    }

    this.segmentationLaneGraphics.lineStyle(1, uiPalette.grid, 0.18);
    for (let y = top + 34; y < bottom - 24; y += 42) {
      this.segmentationLaneGraphics.lineBetween(left + 18, y, left + 30, y);
      this.segmentationLaneGraphics.lineBetween(left + playfield.width - 18, y, left + playfield.width - 30, y);
    }
  }

  private drawTimerPressureLane(
    layout: ReturnType<typeof computePlayLayout>,
    timerState: TimerPressureVisualState
  ): void {
    this.timerPressureGraphics.clear();
    this.timerPressureRect = undefined;
    this.timerPressureDeadlineRect = undefined;

    if (!timerState.warningActive || timerState.laneAlpha <= 0) {
      return;
    }

    const playfield = layout.playfield;
    const laneWidth = Math.min(playfield.width - 32, layout.textPanel.width + (layout.compact ? 40 : 96));
    const laneHeight = layout.textPanel.height + (layout.compact ? 28 : 38);
    const laneLeft = playfield.x - laneWidth / 2;
    const laneRight = playfield.x + laneWidth / 2;
    const top = layout.sentenceActiveY - laneHeight / 2;
    const bottom = layout.sentenceActiveY + laneHeight / 2;
    const corner = Math.min(layout.compact ? 48 : 72, laneWidth * 0.18);
    const vertical = Math.min(layout.compact ? 22 : 30, laneHeight * 0.34);
    const strokeWidth = Math.max(1, timerState.laneStrokeWidth);

    this.timerPressureGraphics.lineStyle(strokeWidth + 2, uiPalette.amberLight, timerState.laneHighlightAlpha);
    this.timerPressureGraphics.lineBetween(laneLeft, top, laneLeft + corner, top);
    this.timerPressureGraphics.lineBetween(laneRight - corner, top, laneRight, top);
    this.timerPressureGraphics.lineBetween(laneLeft, bottom, laneLeft + corner, bottom);
    this.timerPressureGraphics.lineBetween(laneRight - corner, bottom, laneRight, bottom);

    this.timerPressureGraphics.lineStyle(strokeWidth, uiPalette.warning, timerState.laneAlpha);
    this.timerPressureGraphics.lineBetween(laneLeft, top, laneLeft + corner, top);
    this.timerPressureGraphics.lineBetween(laneLeft, top, laneLeft, top + vertical);
    this.timerPressureGraphics.lineBetween(laneRight - corner, top, laneRight, top);
    this.timerPressureGraphics.lineBetween(laneRight, top, laneRight, top + vertical);
    this.timerPressureGraphics.lineBetween(laneLeft, bottom, laneLeft + corner, bottom);
    this.timerPressureGraphics.lineBetween(laneLeft, bottom - vertical, laneLeft, bottom);
    this.timerPressureGraphics.lineBetween(laneRight - corner, bottom, laneRight, bottom);
    this.timerPressureGraphics.lineBetween(laneRight, bottom - vertical, laneRight, bottom);

    if (timerState.deadlineGateAlpha > 0 && timerState.deadlineGateInsetRatio > 0) {
      const gateInset = Math.min(laneWidth * 0.22, laneWidth * timerState.deadlineGateInsetRatio);
      const gateLeft = laneLeft + gateInset;
      const gateRight = laneRight - gateInset;
      const gateTop = top + (layout.compact ? 8 : 10);
      const gateBottom = bottom - (layout.compact ? 8 : 10);
      const promptGap = Math.min(laneHeight * 0.38, layout.textPanel.height * 0.54);
      const upperBottom = layout.sentenceActiveY - promptGap;
      const lowerTop = layout.sentenceActiveY + promptGap;
      const gateStrokeWidth = Math.max(1, timerState.deadlineGateStrokeWidth);

      this.timerPressureGraphics.lineStyle(gateStrokeWidth + 2, uiPalette.amberLight, timerState.deadlineGateAlpha * 0.42);
      this.timerPressureGraphics.lineBetween(gateLeft, gateTop, gateLeft, upperBottom);
      this.timerPressureGraphics.lineBetween(gateRight, gateTop, gateRight, upperBottom);
      this.timerPressureGraphics.lineBetween(gateLeft, lowerTop, gateLeft, gateBottom);
      this.timerPressureGraphics.lineBetween(gateRight, lowerTop, gateRight, gateBottom);
      this.timerPressureGraphics.lineStyle(gateStrokeWidth, uiPalette.warning, timerState.deadlineGateAlpha);
      this.timerPressureGraphics.lineBetween(gateLeft, gateTop, gateLeft, upperBottom);
      this.timerPressureGraphics.lineBetween(gateRight, gateTop, gateRight, upperBottom);
      this.timerPressureGraphics.lineBetween(gateLeft, lowerTop, gateLeft, gateBottom);
      this.timerPressureGraphics.lineBetween(gateRight, lowerTop, gateRight, gateBottom);
      this.timerPressureDeadlineRect = {
        x: playfield.x,
        y: layout.sentenceActiveY,
        width: gateRight - gateLeft,
        height: gateBottom - gateTop
      };
    }

    this.timerPressureRect = {
      x: playfield.x,
      y: layout.sentenceActiveY,
      width: laneWidth,
      height: laneHeight
    };
  }

  private setRobotComment(value: string, options: { showToast?: boolean; sticky?: boolean; maxLength?: number } = {}): void {
    this.overseer.setText(value);
    if (options.showToast ?? true) {
      this.showRobotToast(value, {
        sticky: options.sticky ?? false,
        maxLength: options.maxLength
      });
      return;
    }

    this.hideRobotToast();
  }

  private showRobotToast(value: string, options: { sticky?: boolean; maxLength?: number } = {}): void {
    this.robotToastTimer?.remove(false);
    this.robotToastSticky = options.sticky ?? false;
    const maxLength = options.maxLength ?? robotToastMaxLength(this.compactLayout);
    const sourceText = robotToastSourceText(value, this.robotToastSticky ? false : this.compactLayout);
    this.robotToastText.setText(robotBriefLine(sourceText, maxLength));
    this.robotToastPanel.setVisible(true);
    this.robotToastLabel.setVisible(true);
    this.robotToastText.setVisible(true);
    this.layoutRobotToast();
    this.robotToastPanel.setAlpha(0.96);
    this.robotToastText.setAlpha(1);
    if (!this.robotToastSticky) {
      const durationMs = robotToastDurationMs(sourceText, { tutorialMode: this.tutorialMode, maxLength });
      this.robotToastTimer = this.time.delayedCall(durationMs, () => this.hideRobotToast());
    }
    this.writePlayQaSnapshot();
  }

  private hideRobotToast(): void {
    this.robotToastTimer?.remove(false);
    this.robotToastSticky = false;
    this.robotToastPanel?.setVisible(false);
    this.robotToastLabel?.setVisible(false);
    this.robotToastText?.setVisible(false);
    this.robotToastChrome?.clear();
    this.writePlayQaSnapshot();
  }

  private layoutRobotToast(): void {
    if (!this.robotToastPanel?.visible || !this.robotToastText) {
      return;
    }

    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    const feedbackLayout =
      this.feedbackCard.layoutState() ?? computeFeedbackCardLayout(this.scale.width, this.scale.height, layout.contentPanel);
    const petBounds = this.petWiener.getBounds();
    const petRect = this.qaRectFromBounds(petBounds);
    const reviewSpeech = this.robotToastSticky && this.tutorialMode && this.resolving;
    const speechLayout = computePetSpeechLayout({
      viewport: { width: this.scale.width, height: this.scale.height },
      textPanel: this.qaRectFromBounds(this.textPanel.getBounds()),
      petBounds: petRect,
      feedback: feedbackLayout,
      resolveButton: layout.resolveButton,
      compact: this.compactLayout,
      reviewSpeech,
      evidenceRect: this.tokenEvidenceRect
    });
    const { x, y, width, height } = speechLayout.panel;

    this.robotToastPanel.setPosition(x, y);
    this.robotToastPanel.setSize(width, height);
    this.drawPetSpeechChrome({
      panel: { x, y, width, height },
      mouth: {
        x: petBounds.left + petBounds.width * 0.36,
        y: petBounds.top + petBounds.height * 0.45
      }
    });
    this.robotToastLabel.setVisible(false);
    this.robotToastText.setPosition(speechLayout.text.x, speechLayout.text.y);
    this.robotToastText.setStyle({ fontSize: `${speechLayout.text.fontSize}px` });
    this.robotToastText.setWordWrapWidth(speechLayout.text.wordWrapWidth);
  }

  private drawPetSpeechChrome(layout: {
    panel: GameQaRect;
    mouth: { x: number; y: number };
  }): void {
    const panel = layout.panel;
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    const right = left + panel.width;
    const bottom = top + panel.height;
    const tailStartX = Math.max(left + 28, Math.min(right - 28, right - 38));

    this.robotToastChrome.clear();
    this.robotToastChrome.fillStyle(uiPalette.panelLight, 0.98);
    this.robotToastChrome.fillRoundedRect(left, top, panel.width, panel.height, 8);
    this.robotToastChrome.lineStyle(1, uiPalette.strokeDark, 0.66);
    this.robotToastChrome.strokeRoundedRect(left, top, panel.width, panel.height, 8);
    this.robotToastChrome.fillStyle(uiPalette.panelLight, 0.98);
    this.robotToastChrome.fillTriangle(tailStartX, bottom - 3, tailStartX + 26, bottom - 6, layout.mouth.x, layout.mouth.y);
    this.robotToastChrome.lineStyle(1, uiPalette.strokeDark, 0.5);
    this.robotToastChrome.lineBetween(tailStartX + 8, bottom - 3, layout.mouth.x, layout.mouth.y);
  }

  private showTutorialPopup(
    copy: { title: string; body: string },
    durationMs: number | null = 5200,
    options: { mirrorToast?: boolean } = {}
  ): void {
    this.tutorialPopupTimer?.remove(false);
    this.tutorialPopupFullTitle = copy.title;
    this.tutorialPopupFullBody = copy.body;
    this.tutorialPopupPanel?.setVisible(false);
    this.tutorialPopupHeader?.setVisible(false);
    this.tutorialPopupTitle?.setVisible(false);
    this.tutorialPopupBody?.setVisible(false);
    this.tutorialPopupStamp?.setVisible(false);
    this.tutorialPopupChrome?.clear();
    if (options.mirrorToast ?? true) {
      this.showRobotToast(copy.body, { maxLength: this.tutorialReviewSpeechMaxLength() });
    }
    if (durationMs !== null) {
      this.tutorialPopupTimer = this.time.delayedCall(durationMs, () => this.hideTutorialPopup());
    }
    this.writePlayQaSnapshot();
  }

  private hideTutorialPopup(): void {
    this.tutorialPopupTimer?.remove(false);
    this.tutorialPopupFullTitle = "";
    this.tutorialPopupFullBody = "";
    this.tutorialPopupPanel?.setVisible(false);
    this.tutorialPopupHeader?.setVisible(false);
    this.tutorialPopupTitle?.setVisible(false);
    this.tutorialPopupBody?.setVisible(false);
    this.tutorialPopupStamp?.setVisible(false);
    this.tutorialPopupChrome?.clear();
    this.writePlayQaSnapshot();
  }

  private layoutTutorialPopup(): void {
    this.tutorialPopupChrome?.clear();
  }

  private computeRestingSentenceY(): number {
    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    return this.resolving ? layout.sentenceReviewY : layout.sentenceStartY;
  }

  private drawTextPanelChrome(): void {
    this.textPanelChrome.clear();
  }

  private layoutSegmentationEvidence(): void {
    if (!this.tokenStripText.visible || !this.tokenStripText.text) {
      this.tokenEvidenceChrome?.clear();
      this.tokenEvidenceChrome?.setVisible(false);
      this.tokenEvidenceRect = undefined;
      return;
    }

    const layout = segmentationEvidenceLayout({
      viewport: { width: this.scale.width, height: this.scale.height },
      textPanel: this.qaRectFromBounds(this.textPanel.getBounds()),
      compact: this.compactLayout,
      lineCount: this.tokenStripText.text.split("\n").length
    });

    this.tokenEvidenceRect = layout.panel;
    const reveal = this.currentSegmentationEvidenceRevealState();
    this.tokenEvidenceChrome.setVisible(true);
    this.drawSegmentationEvidenceChrome(layout.panel, this.tokenStripText.text, layout.text, reveal);
    this.tokenStripText.setPosition(layout.text.x, layout.text.y);
    this.tokenStripText.setWordWrapWidth(layout.text.wordWrapWidth);
    this.tokenStripText.setStyle({
      fontSize: `${layout.text.fontSize}px`,
      color: uiPalette.text
    });
    this.tokenStripText.setAlpha(reveal.textAlpha);
    this.tokenStripText.setPadding(
      layout.text.paddingX,
      layout.text.paddingY,
      layout.text.paddingX,
      layout.text.paddingY
    );
  }

  private drawSegmentationEvidenceChrome(
    panel: GameQaRect,
    evidenceText: string,
    textLayout: ReturnType<typeof segmentationEvidenceLayout>["text"],
    reveal: SegmentationEvidenceRevealState
  ): void {
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    const right = left + panel.width;
    const rows = segmentationEvidenceTokenRows(evidenceText);
    const chipSpans = segmentationEvidenceChipSpans(evidenceText);
    const headerLineCount = segmentationEvidenceHeaderLineCount(evidenceText);
    const denseEvidence = this.compactLayout || usesShortLandscapeReviewLayout({
      width: this.scale.width,
      height: this.scale.height
    });
    const lineHeight = textLayout.fontSize + (denseEvidence ? 5 : 7);
    const charWidth = textLayout.fontSize * (denseEvidence ? 0.62 : 0.58);
    const rowStartY = top + (denseEvidence ? 43 : 47) + Math.max(0, headerLineCount - 1) * lineHeight;

    this.tokenEvidenceChrome.clear();
    this.tokenEvidenceChrome.fillStyle(uiPalette.panelLight, reveal.panelAlpha);
    this.tokenEvidenceChrome.fillRoundedRect(left, top, panel.width, panel.height, 5);
    this.tokenEvidenceChrome.fillStyle(uiPalette.panelTint, 0.52 + reveal.accentAlpha * 0.18);
    this.tokenEvidenceChrome.fillRoundedRect(left + 3, top + 3, panel.width - 6, 15, 4);
    this.tokenEvidenceChrome.fillStyle(uiPalette.amber, 0.78 + reveal.accentAlpha * 0.16);
    this.tokenEvidenceChrome.fillRect(left + 3, top + 3, Math.min(118, panel.width * 0.28) * reveal.topRuleWidthScale, 4);
    if (reveal.active) {
      this.tokenEvidenceChrome.fillStyle(uiPalette.amberLight, reveal.accentAlpha);
      this.tokenEvidenceChrome.fillRoundedRect(left + 4, top + 19, panel.width - 8, panel.height - 23, 4);
    }
    this.tokenEvidenceChrome.lineStyle(1, uiPalette.strokeDark, 0.7);
    this.tokenEvidenceChrome.strokeRoundedRect(left, top, panel.width, panel.height, 5);
    this.tokenEvidenceChrome.lineStyle(1, uiPalette.stroke, 0.38);
    this.tokenEvidenceChrome.lineBetween(left + 12, top + 30, right - 12, top + 30);

    for (const span of chipSpans) {
      const row = rows[span.rowIndex] ?? "";
      const rowWidth = row.length * charWidth;
      const rowLeft = panel.x - rowWidth / 2;
      const chipX = rowLeft + span.start * charWidth - 4;
      const chipY = rowStartY + span.rowIndex * lineHeight - textLayout.fontSize / 2 - 4;
      const chipWidth = span.length * charWidth + 8;
      const chipHeight = textLayout.fontSize + 10;
      this.tokenEvidenceChrome.fillStyle(
        span.leadingSpace ? uiPalette.amberLight : uiPalette.coldGlass,
        (span.leadingSpace ? 0.42 : 0.58) + reveal.chipBoostAlpha
      );
      this.tokenEvidenceChrome.fillRoundedRect(chipX, chipY, chipWidth, chipHeight, 4);
      this.tokenEvidenceChrome.lineStyle(1.25, span.leadingSpace ? uiPalette.amber : uiPalette.strokeDark, span.leadingSpace ? 0.62 : 0.42);
      this.tokenEvidenceChrome.strokeRoundedRect(chipX, chipY, chipWidth, chipHeight, 4);
    }
  }

  private renderSlotHints(): void {
    this.clearSlotHints();
    if (!this.currentFixture || !this.shouldShowSlotHints()) {
      return;
    }

    const bounds = this.textObject.getBounds();
    const slots = this.swipe.buildPlayableSlots(bounds, this.currentFixture.text, true);
    const targetHintsVisible = this.tutorialMode && this.currentTutorialRound?.showTargetHints === true;
    const slotStyle = playableSlotHintVisualStyle({
      tutorialMode: this.tutorialMode,
      targetHintsVisible,
      stagedCutCount: this.currentCuts.length,
      compact: this.compactLayout
    });
    const slotHalfHeight = (bounds.height + 26) / 2;
    const targetHalfHeight = (bounds.height + 34) / 2;

    this.slotHintGraphics.lineStyle(slotStyle.lineWidth, 0x88a7c9, slotStyle.alpha);
    for (const slot of slots) {
      this.slotHintGraphics.lineBetween(slot.x, bounds.centerY - slotHalfHeight, slot.x, bounds.centerY + slotHalfHeight);
    }

    if (targetHintsVisible) {
      this.targetHintGraphics.lineStyle(4, uiPalette.amber, 0.84);
      for (const boundary of this.currentFixture.boundary_positions) {
        const x = this.swipe.boundaryX(bounds, this.currentFixture.text, boundary);
        if (x === null) continue;
        this.targetHintGraphics.lineBetween(x, bounds.centerY - targetHalfHeight, x, bounds.centerY + targetHalfHeight);
      }
    }
  }

  private shouldShowSlotHints(): boolean {
    return shouldShowPlayableSlotHints({
      tutorialMode: this.tutorialMode,
      round: this.round,
      tutorialShowSlotHints: this.currentTutorialRound?.showSlotHints
    });
  }

  private renderCutStatus(): void {
    if (!this.currentFixture || this.resolving) {
      this.cutStatusText?.setVisible(false);
      this.cutStatusBadgeGraphics?.clear();
      this.cutStatusBadgeRect = undefined;
      this.clearInputResponseBadge();
      return;
    }

    const cutCount = this.currentCuts.length;
    if (cutCount !== this.lastCutStatusCount) {
      this.lastCutStatusCount = cutCount;
      this.cutStatusPulseStartedAt = this.baseNowMs();
    }

    const pulseAge = this.cutStatusPulseStartedAt === undefined ? undefined : this.baseNowMs() - this.cutStatusPulseStartedAt;
    const style = activeCutStatusBadgeStyle(cutCount, this.compactLayout, pulseAge);
    if (pulseAge !== undefined && pulseAge >= ACTIVE_CUT_STATUS_PULSE_MS) {
      this.cutStatusPulseStartedAt = undefined;
    }

    this.cutStatusText.setText(activeCutStatusText(cutCount, this.compactLayout));
    this.cutStatusText.setStyle({
      fontSize: `${style.fontSize}px`,
      color: cutCount > 0 ? uiPalette.textMuted : uiPalette.textFaint
    });
    this.cutStatusText.setVisible(true);
    this.drawCutStatusBadge(style);
    this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));
  }

  private drawCutStatusBadge(style: ReturnType<typeof activeCutStatusBadgeStyle>): void {
    this.cutStatusBadgeGraphics.clear();

    const bounds = this.cutStatusText.getBounds();
    const width = bounds.width + style.paddingX * 2;
    const height = bounds.height + style.paddingY * 2;
    const x = bounds.centerX;
    const y = bounds.centerY;
    const left = x - width / 2;
    const top = y - height / 2;
    const radius = this.compactLayout ? 3 : 4;

    this.cutStatusBadgeGraphics.fillStyle(uiPalette.panelLight, style.fillAlpha);
    this.cutStatusBadgeGraphics.fillRoundedRect(left, top, width, height, radius);
    this.cutStatusBadgeGraphics.lineStyle(style.strokeWidth, uiPalette.amber, style.strokeAlpha);
    this.cutStatusBadgeGraphics.strokeRoundedRect(left, top, width, height, radius);
    if (style.pulse > 0) {
      this.cutStatusBadgeGraphics.lineStyle(1, uiPalette.amberLight, style.pulse * 0.32);
      this.cutStatusBadgeGraphics.lineBetween(left + 4, top + 2, left + width - 4, top + 2);
    }

    this.cutStatusBadgeRect = { x, y, width, height };
  }

  private renderInputResponseBadge(inputFeel: InputFeelMetricsSnapshot): void {
    const state = inputResponseBadgeState(inputFeel, this.compactLayout);
    if (!state || !this.cutStatusText.visible || !this.cutStatusBadgeRect) {
      this.clearInputResponseBadge();
      return;
    }

    this.inputResponseBadgeText.setText(state.text);
    this.inputResponseBadgeText.setStyle({
      fontSize: `${state.fontSize}px`,
      color: uiPalette.textMuted
    });

    const textPanelBounds = this.textPanel.getBounds();
    const textBounds = this.inputResponseBadgeText.getBounds();
    const width = textBounds.width + state.paddingX * 2;
    const height = textBounds.height + state.paddingY * 2;
    const gap = this.compactLayout ? 6 : 8;
    const minX = textPanelBounds.left + width / 2 + 8;
    const maxX = textPanelBounds.right - width / 2 - 8;
    const statusRight = this.cutStatusBadgeRect.x + this.cutStatusBadgeRect.width / 2;
    const statusLeft = this.cutStatusBadgeRect.x - this.cutStatusBadgeRect.width / 2;
    let x = statusRight + gap + width / 2;
    if (x > maxX) {
      x = statusLeft - gap - width / 2;
    }
    x = Math.max(minX, Math.min(maxX, x));
    const y = this.cutStatusBadgeRect.y;
    const left = x - width / 2;
    const top = y - height / 2;
    const radius = this.compactLayout ? 3 : 4;
    const toneColor = inputResponseBadgeToneColor(state.tone);

    this.inputResponseBadgeText.setPosition(x, y);
    this.inputResponseBadgeText.setAlpha(state.alpha);
    this.inputResponseBadgeText.setVisible(true);
    this.inputResponseBadgeGraphics.clear();
    this.inputResponseBadgeGraphics.setVisible(true);
    this.inputResponseBadgeGraphics.fillStyle(uiPalette.panelLight, state.fillAlpha * state.alpha);
    this.inputResponseBadgeGraphics.fillRoundedRect(left, top, width, height, radius);
    this.inputResponseBadgeGraphics.lineStyle(1, toneColor, state.strokeAlpha * state.alpha);
    this.inputResponseBadgeGraphics.strokeRoundedRect(left, top, width, height, radius);
    this.inputResponseBadgeRect = { x, y, width, height };
    this.inputResponseBadgeTone = state.tone;
  }

  private updateInputResponseBadge(): void {
    if (!this.inputResponseBadgeText.visible) {
      return;
    }

    this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));
    if (!this.inputResponseBadgeText.visible) {
      this.writePlayQaSnapshot();
    }
  }

  private clearInputResponseBadge(): void {
    this.inputResponseBadgeGraphics?.clear();
    this.inputResponseBadgeGraphics?.setVisible(false);
    this.inputResponseBadgeText?.setVisible(false);
    this.inputResponseBadgeRect = undefined;
    this.inputResponseBadgeTone = undefined;
  }

  private startPromptAcquisitionBeat(time: number): void {
    this.promptAcquisitionStartedAt = time;
    this.drawPromptAcquisitionBeat(time);
    this.writePlayQaSnapshot();
  }

  private updatePromptAcquisitionBeat(time: number): void {
    if (this.promptAcquisitionStartedAt === undefined) {
      return;
    }

    this.drawPromptAcquisitionBeat(time);
  }

  private drawPromptAcquisitionBeat(time: number): void {
    if (!this.currentFixture || this.resolving || !this.textObject.visible || this.promptAcquisitionStartedAt === undefined) {
      this.clearPromptAcquisitionBeat();
      return;
    }

    const state = this.currentPromptAcquisitionState(time);
    if (!state.active) {
      this.clearPromptAcquisitionBeat();
      this.writePlayQaSnapshot();
      return;
    }

    const bounds = this.textObject.getBounds();
    const left = bounds.x - state.paddingX;
    const right = bounds.x + bounds.width + state.paddingX;
    const top = bounds.y - state.paddingY;
    const bottom = bounds.y + bounds.height + state.paddingY;
    const width = right - left;
    const height = bottom - top;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const bracket = Math.min(this.compactLayout ? 18 : 28, Math.max(12, width * 0.16));
    const sweepWidth = Math.max(18, width * state.sweepScale);
    const sweepLeft = centerX - sweepWidth / 2;
    const sweepRight = centerX + sweepWidth / 2;
    const sweepY = bottom + (this.compactLayout ? 5 : 7);

    this.promptAcquisitionGraphics.clear();
    this.promptAcquisitionGraphics.setVisible(true);
    this.promptAcquisitionGraphics.lineStyle(state.strokeWidth + 5, uiPalette.amberLight, state.frameAlpha * 0.16);
    this.drawPromptAcquisitionCorners(left, right, top, bottom, bracket);
    this.promptAcquisitionGraphics.lineStyle(state.strokeWidth, uiPalette.amber, state.frameAlpha);
    this.drawPromptAcquisitionCorners(left, right, top, bottom, bracket);
    this.promptAcquisitionGraphics.lineStyle(state.strokeWidth + 1, uiPalette.amberLight, state.sweepAlpha);
    this.promptAcquisitionGraphics.lineBetween(sweepLeft, sweepY, sweepRight, sweepY);

    this.promptAcquisitionText
      .setText(state.labelText)
      .setFontSize(this.compactLayout ? 9 : 10)
      .setAlpha(state.labelAlpha)
      .setPosition(centerX, top - (this.compactLayout ? 8 : 10))
      .setVisible(true);

    this.promptAcquisitionRect = {
      x: centerX,
      y: centerY,
      width,
      height: height + (this.compactLayout ? 12 : 16)
    };
  }

  private drawPromptAcquisitionCorners(left: number, right: number, top: number, bottom: number, bracket: number): void {
    this.promptAcquisitionGraphics.lineBetween(left, top, left + bracket, top);
    this.promptAcquisitionGraphics.lineBetween(left, top, left, top + bracket);
    this.promptAcquisitionGraphics.lineBetween(right, top, right - bracket, top);
    this.promptAcquisitionGraphics.lineBetween(right, top, right, top + bracket);
    this.promptAcquisitionGraphics.lineBetween(left, bottom, left + bracket, bottom);
    this.promptAcquisitionGraphics.lineBetween(left, bottom, left, bottom - bracket);
    this.promptAcquisitionGraphics.lineBetween(right, bottom, right - bracket, bottom);
    this.promptAcquisitionGraphics.lineBetween(right, bottom, right, bottom - bracket);
  }

  private clearPromptAcquisitionBeat(): void {
    this.promptAcquisitionStartedAt = undefined;
    this.promptAcquisitionGraphics?.clear();
    this.promptAcquisitionGraphics?.setVisible(false);
    this.promptAcquisitionText?.setVisible(false);
    this.promptAcquisitionText?.setAlpha(1);
    this.promptAcquisitionRect = undefined;
  }

  private currentPromptAcquisitionState(time: number): PromptAcquisitionVisualState {
    return promptAcquisitionVisualState({
      elapsedMs: this.promptAcquisitionStartedAt === undefined
        ? Number.POSITIVE_INFINITY
        : Math.max(0, time - this.promptAcquisitionStartedAt),
      compact: this.compactLayout,
      tutorialMode: this.tutorialMode
    });
  }

  private writePlayQaSnapshot(options: PlayQaSnapshotOptions = {}): void {
    if (!import.meta.env.DEV || !this.currentFixture) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const layout = computePlayLayout({ width, height });
    const hudLayout = computeHudLayout(width, layout.contentPanel);
    const overseerLayout = computeOverseerPanelLayout(width, height, layout.overseerReservedRight);
    const feedbackLayout = this.feedbackCard.layoutState() ?? computeFeedbackCardLayout(width, height, layout.contentPanel);
    const textBounds = this.textObject.getBounds();
    const overseerQa = this.overseer.qaState();
    const feedbackQa = this.feedbackCard.qaState();
    const motionQa = this.motionQaState();
    const useRendererCapture = this.shouldUseRendererQaCapture();
    const hudImpact = this.currentHudImpactState(this.nowMs());
    const hudImpactLabelBounds = this.hud.impactLabelBounds();
    const promptAcquisitionState = this.currentPromptAcquisitionState(this.nowMs());
    const timerPressure = this.currentTimerPressureState(this.nowMs());
    const inputFeel = this.inputFeelMetrics.snapshot(this.baseNowMs());
    const hudProgress = this.hudProgressState();
    const tokenStripRect = this.tokenEvidenceRect ?? this.qaRectFromBounds(this.tokenStripText.getBounds());
    const tutorialReviewDwellRemainingMs = this.tutorialReviewReadyAtMs === null
      ? null
      : Math.max(0, this.tutorialReviewReadyAtMs - this.baseNowMs());
    const playableSlots = this.swipe.buildPlayableSlots(textBounds, this.currentFixture.text, this.shouldShowSlotHints());
    const snapDistancePx = this.swipe.snapDistanceForViewport(width);
    const previewDistancePx = this.swipe.previewDistanceForViewport(width);

    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: this.tutorialMode ? "tutorial" : "endless",
      phase: this.resolving ? "review" : "active",
      round: this.round,
      fixtureId: this.currentFixture.id,
      fixtureText: this.currentFixture.text,
      cutCount: this.currentCuts.length,
      activeCutPulseCount: this.activeCutPulseStartedAt.size,
      activeCutPulseKinds: this.activeCutPulseKindsForQa(),
      activeCutLabelRects: this.activeCutLabels.map((entry) => ({
        text: entry.label.text,
        rect: this.qaRectFromBounds(entry.label.getBounds())
      })),
      resolvedCutLabelRects: this.resolvedCutLabelRects,
      resolutionAuditLegendRect: this.resolutionAuditLegendRect,
      resolutionAuditLegendText: this.resolutionAuditLegendText,
      legalSlotCount: playableSlots.length,
      playableSlotRects: playableSlots.map((slot) => ({
        boundary: slot.index,
        hinted: slot.hinted,
        rect: {
          x: slot.x,
          y: (slot.yMin + slot.yMax) / 2,
          width: snapDistancePx * 2,
          height: slot.yMax - slot.yMin
        }
      })),
      snapDistancePx,
      previewDistancePx,
      inputModality: this.inputModality,
      inputFeel,
      inputResponseBadgeText: this.inputResponseBadgeText.visible ? this.inputResponseBadgeText.text : undefined,
      inputResponseBadgeTone: this.inputResponseBadgeText.visible ? this.inputResponseBadgeTone : undefined,
      inputResponseBadgeRect: this.inputResponseBadgeText.visible ? this.inputResponseBadgeRect : undefined,
      cutStatusText: this.cutStatusText.text,
      cutStatusVisible: this.cutStatusText.visible && !this.resolving,
      tokenStripText: this.tokenStripText.text,
      tokenStripVisible: this.tokenStripText.visible,
      promptBackingVisible: this.textPanel.visible || this.textPanelShadow.visible,
      promptTextVisible: this.textObject.visible,
      promptAcquisitionActive: promptAcquisitionState.active,
      promptAcquisitionProgress: promptAcquisitionState.progress,
      promptAcquisitionRect: this.promptAcquisitionRect,
      promptAcquisitionText: this.promptAcquisitionText.visible ? this.promptAcquisitionText.text : undefined,
      promptAcquisitionTextRect: this.promptAcquisitionText.visible ? this.qaRectFromBounds(this.promptAcquisitionText.getBounds()) : undefined,
      fallingTextPieceCount: this.fallingTextPieces.length,
      textFontSize: this.gameTextFontSize(this.textObject),
      cutStatusFontSize: this.gameTextFontSize(this.cutStatusText),
      tokenStripFontSize: this.gameTextFontSize(this.tokenStripText),
      textPanelRect: this.qaRectFromBounds(this.textPanel.getBounds()),
      textRect: this.qaRectFromBounds(textBounds),
      segmentationEvidenceRect: this.tokenEvidenceRect,
      segmentationEvidenceRevealActive: this.currentSegmentationEvidenceRevealState().active,
      segmentationEvidenceRevealProgress: this.currentSegmentationEvidenceRevealState().progress,
      logoWienerRect: this.qaRectFromBounds(this.headerWienerLogo.getBounds()),
      petWienerRect: this.qaRectFromBounds(this.petWiener.getBounds()),
      petReactionActive: this.petReactionTween !== undefined,
      petReactionKind: this.petReactionKind,
      petReactionScaleX: this.normalizedPetReactionScaleX(),
      petReactionScaleY: this.normalizedPetReactionScaleY(),
      petReactionPeakScaleX: this.petReactionPeakScaleX,
      petReactionPeakScaleY: this.petReactionPeakScaleY,
      cutStatusRect: this.cutStatusBadgeRect ?? this.qaRectFromBounds(this.cutStatusText.getBounds()),
      tokenStripRect,
      hudRect: {
        x: hudLayout.background.x,
        y: hudLayout.background.y + hudLayout.background.height / 2,
        width: hudLayout.background.width,
        height: hudLayout.background.height
      },
      overseerRect: overseerLayout.panel,
      resolveButtonText: this.resolveLabel?.text,
      resolveButtonActionable: this.resolveButtonActionable(),
      resolveButtonReady: !this.resolving && this.currentCuts.length > 0,
      resolveButtonReadyPulse: this.resolveReadyPulseStartedAt === undefined
        ? null
        : Math.max(0, Math.min(1, 1 - (this.baseNowMs() - this.resolveReadyPulseStartedAt) / RESOLVE_READY_PULSE_MS)),
      resolveButtonDeadlinePressure: this.resolveDeadlinePressure(),
      clearButtonText: this.clearLabel?.text,
      clearButtonActionable: this.clearButtonActionable(),
      muteButtonText: this.muteLabel?.text,
      exitButtonText: this.exitLabel?.text,
      overseerVisible: this.overseer.isVisible(),
      overseerText: overseerQa.text,
      overseerFontSize: overseerQa.fontSize,
      overseerWordWrapWidth: overseerQa.wordWrapWidth,
      feedbackRect: feedbackLayout,
      feedbackVisible: this.feedbackCard.isVisible(),
      feedbackText: feedbackQa.text,
      tutorialReviewReady: this.tutorialReviewCanAdvance(),
      tutorialReviewDwellRemainingMs,
      armedPreviewBoundary: this.armedPreviewBoundary,
      armedPreviewStrength: this.armedPreviewStrength,
      armedPreviewReady: this.armedPreviewReady,
      armedPreviewRect: this.armedPreviewRect,
      touchAimLoupeBoundary: this.touchAimLoupeBoundary,
      touchAimLoupeSnapReady: this.touchAimLoupeSnapReady,
      touchAimLoupeText: this.touchAimLoupeText.visible ? this.touchAimLoupeText.text : undefined,
      touchAimLoupeRect: this.touchAimLoupeRect,
      touchAimLoupePointerClearancePx: this.touchAimLoupePointerClearancePx,
      touchAimLoupeOcclusionSafe: this.touchAimLoupeOcclusionSafe,
      touchAimLoupePlacement: this.touchAimLoupePlacement,
      motionStartY: motionQa.startY,
      motionEndY: motionQa.endY,
      motionCurrentY: motionQa.currentY,
      motionElapsedMs: motionQa.elapsedMs,
      motionDurationMs: motionQa.durationMs,
      motionProgress: motionQa.progress,
      motionPaused: motionQa.paused,
      hudImpactActive: hudImpact.active,
      hudImpactTone: hudImpact.tone,
      hudImpactTargets: hudImpact.targets,
      hudImpactDeltaText: hudImpact.deltaText,
      hudImpactDeltaAlpha: hudImpact.deltaAlpha,
      hudImpactDeltaRect: hudImpactLabelBounds ? this.qaRectFromBounds(hudImpactLabelBounds) : undefined,
      hudProgressLabel: hudProgress.label,
      hudProgressCurrent: hudProgress.current,
      hudProgressTarget: hudProgress.target,
      timerWarningActive: timerPressure.warningActive,
      timerWarningIntensity: timerPressure.warningIntensity,
      timerPressureRect: this.timerPressureRect,
      timerPressureDeadlineRect: this.timerPressureDeadlineRect,
      petSpeechText: this.robotToastPanel.visible ? this.robotToastText.text : undefined,
      petSpeechFontSize: this.robotToastPanel.visible ? this.gameTextFontSize(this.robotToastText) : undefined,
      petSpeechRect: this.robotToastPanel.visible ? this.qaRectFromBounds(this.robotToastPanel.getBounds()) : undefined,
      textCutImpactActive: this.textCutImpactGhost?.active ?? false,
      textCutImpactRect: this.textCutImpactGhost?.active ? this.qaRectFromBounds(this.textCutImpactGhost.getBounds()) : undefined,
      resolveCommitBeatActive: this.resolveCommitGraphics?.visible ?? false,
      resolveCommitBeatRect: this.resolveCommitGraphics?.visible ? this.resolveCommitRect : undefined,
      resolveCommitBeatText: this.resolveCommitText?.visible ? this.resolveCommitText.text : undefined,
      resolveCommitBeatTextRect: this.resolveCommitText?.visible ? this.qaRectFromBounds(this.resolveCommitText.getBounds()) : undefined,
      resolutionTrigger: this.lastResolveTrigger,
      clearCutFeedbackActive: this.clearCutFeedbackRect !== undefined,
      clearCutFeedbackRect: this.clearCutFeedbackRect,
      cutCorrectionFeedbackActive: this.cutCorrectionFeedbackRect !== undefined,
      cutCorrectionFeedbackRect: this.cutCorrectionFeedbackRect,
      chainSwipeFeedbackActive: this.chainSwipeFeedbackRect !== undefined,
      chainSwipeFeedbackRect: this.chainSwipeFeedbackRect,
      noCutFeedbackActive: this.noCutFeedbackText?.visible ?? false,
      noCutFeedbackRect: this.noCutFeedbackText?.visible ? this.noCutFeedbackRect : undefined,
      noCutFeedbackText: this.noCutFeedbackText?.visible ? this.noCutFeedbackText.text : undefined,
      noCutFeedbackReason: this.noCutFeedbackText?.visible ? this.noCutFeedbackReason : undefined,
      noCutFeedbackDirection: this.noCutFeedbackText?.visible ? this.noCutFeedbackDirection : undefined,
      rendererQaCapture: useRendererCapture,
      rendererQaCaptureStatus: this.rendererQaCaptureStatus
    });

    const captureCanvas = options.captureCanvas === true || this.qaControls.canvasCapture === true;
    writeGameQaSnapshot(snapshot, { captureCanvas: captureCanvas && !useRendererCapture });
    if (captureCanvas && useRendererCapture) {
      this.captureRendererQaSnapshot(snapshot);
    }
  }

  private resolveButtonActionable(): boolean {
    if (this.resolving && this.tutorialMode) {
      return this.tutorialReviewCanAdvance();
    }

    return !this.resolving;
  }

  private clearButtonActionable(): boolean {
    return !this.resolving && this.currentCuts.length > 0;
  }

  private shouldUseRendererQaCapture(): boolean {
    if (!import.meta.env.DEV) {
      return false;
    }

    const frozenMotionCapture =
      this.qaControls.freezeElapsedMs !== undefined && (this.sentenceMotion !== undefined || this.resolving);
    return frozenMotionCapture || this.hasTransientRendererQaFeedback();
  }

  private hasTransientRendererQaFeedback(): boolean {
    return this.inputResponseBadgeText?.visible === true
      || this.promptAcquisitionText?.visible === true
      || this.cutCorrectionFeedbackRect !== undefined
      || this.chainSwipeFeedbackRect !== undefined
      || this.noCutFeedbackText?.visible === true
      || this.textCutImpactGhost?.active === true
      || this.clearCutFeedbackRect !== undefined
      || this.resolveCommitGraphics?.visible === true
      || this.currentHudImpactState(this.nowMs()).active;
  }

  private captureRendererQaSnapshot(snapshot: GameQaSnapshot): void {
    const signature = this.rendererQaCaptureSignature(snapshot);
    if (this.rendererQaCapturePending || this.lastRendererQaCaptureSignature === signature) {
      return;
    }

    this.rendererQaCapturePending = true;
    this.lastRendererQaCaptureSignature = signature;
    this.rendererQaCaptureStatus = "pending";

    const captureAfterPaint = () => {
      this.rendererQaCapturePending = false;
      this.renderQaFrameForCapture();
      const capture = this.captureWebGlQaImage() ?? this.captureCanvasQaImage();
      if (!capture) {
        this.rendererQaCaptureStatus = "unavailable";
        this.writeRendererQaCaptureStatus(snapshot);
        return;
      }

      this.rendererQaCaptureStatus = "ok";
      writeGameQaImageCapture(snapshot, capture);
      this.writeRendererQaCaptureStatus(snapshot);
    };

    if (typeof globalThis.setTimeout === "function") {
      globalThis.setTimeout(captureAfterPaint, 250);
      return;
    }

    this.time.delayedCall(0, captureAfterPaint);
  }

  private renderQaFrameForCapture(): void {
    const renderer = this.game.renderer as {
      preRender?: () => void;
      postRender?: () => void;
    };
    const sceneManager = this.game.scene as {
      render?: (renderer: Phaser.Renderer.Canvas.CanvasRenderer | Phaser.Renderer.WebGL.WebGLRenderer) => void;
    };

    try {
      renderer.preRender?.();
      sceneManager.render?.(this.game.renderer);
      renderer.postRender?.();
    } catch {
      // QA capture must not interrupt the playable scene.
    }
  }

  private captureWebGlQaImage(): { width: number; height: number; dataUrl: string } | undefined {
    const renderer = this.game.renderer as { gl?: WebGLRenderingContext | WebGL2RenderingContext };
    const gl = renderer.gl;
    if (!gl || typeof gl.readPixels !== "function") {
      return undefined;
    }

    const width = gl.drawingBufferWidth || this.scale.width;
    const height = gl.drawingBufferHeight || this.scale.height;
    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const pixels = new Uint8Array(width * height * 4);
    try {
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return {
        width,
        height,
        dataUrl: encodeRgbaPngDataUrl(width, height, pixels, { flipY: true })
      };
    } catch {
      return undefined;
    }
  }

  private captureCanvasQaImage(): { width: number; height: number; dataUrl: string } | undefined {
    const renderer = this.game.renderer as {
      currentContext?: CanvasRenderingContext2D;
      gameCanvas?: HTMLCanvasElement;
    };
    const canvas = renderer.gameCanvas;
    const context = renderer.currentContext ?? canvas?.getContext?.("2d") ?? undefined;
    const width = canvas?.width ?? this.scale.width;
    const height = canvas?.height ?? this.scale.height;

    if (!context || width <= 0 || height <= 0 || typeof context.getImageData !== "function") {
      return undefined;
    }

    try {
      const imageData = context.getImageData(0, 0, width, height);
      return {
        width,
        height,
        dataUrl: encodeRgbaPngDataUrl(width, height, imageData.data)
      };
    } catch {
      return undefined;
    }
  }

  private rendererQaCaptureSignature(snapshot: GameQaSnapshot): string {
    return [
      snapshot.scene,
      snapshot.viewport.width,
      snapshot.viewport.height,
      snapshot.state?.phase,
      snapshot.state?.round,
      snapshot.state?.cutCount,
      snapshot.state?.motionCurrentY,
      snapshot.state?.inputResponseBadgeText,
      snapshot.state?.inputResponseBadgeTone,
      snapshot.state?.promptAcquisitionActive,
      snapshot.state?.promptAcquisitionProgress,
      snapshot.state?.cutCorrectionFeedbackActive,
      snapshot.state?.chainSwipeFeedbackActive,
      snapshot.state?.noCutFeedbackActive,
      snapshot.state?.noCutFeedbackText,
      snapshot.state?.textCutImpactActive,
      snapshot.state?.clearCutFeedbackActive,
      snapshot.state?.resolveCommitBeatActive,
      snapshot.state?.hudImpactDeltaText,
      this.robotToastPanel.visible ? this.robotToastText.text : ""
    ].join("|");
  }

  private writeRendererQaCaptureStatus(snapshot: GameQaSnapshot): void {
    writeGameQaSnapshot({
      ...snapshot,
      state: {
        ...snapshot.state,
        rendererQaCaptureStatus: this.rendererQaCaptureStatus
      }
    }, { captureCanvas: false });
  }

  private motionQaState(): {
    startY: number | null;
    endY: number | null;
    currentY: number | null;
    elapsedMs: number | null;
    durationMs: number | null;
    progress: number | null;
    paused: boolean | null;
  } {
    if (!this.sentenceMotion || this.resolving) {
      return {
        startY: null,
        endY: null,
        currentY: null,
        elapsedMs: null,
        durationMs: null,
        progress: null,
        paused: null
      };
    }

    const now = this.nowMs();
    const elapsedMs = this.motion.elapsedActiveMs(this.sentenceMotion, now);
    const durationMs = Math.max(0, this.sentenceMotion.durationMs);
    const progress = durationMs <= 0 ? 1 : Math.max(0, Math.min(1, elapsedMs / durationMs));

    return {
      startY: this.sentenceMotion.startY,
      endY: this.sentenceMotion.endY,
      currentY: this.motion.positionAt(this.sentenceMotion, now),
      elapsedMs,
      durationMs,
      progress,
      paused: this.sentenceMotion.paused
    };
  }

  private qaRectFromBounds(bounds: Phaser.Geom.Rectangle): GameQaRect {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      width: bounds.width,
      height: bounds.height
    };
  }

  private gameTextFontSize(text: Phaser.GameObjects.Text): number {
    const fontSize = Number.parseFloat(String(text.style.fontSize));
    return Number.isFinite(fontSize) ? fontSize : 0;
  }

  private remainingTimeMs(time: number): number {
    if (this.sentenceMotion) {
      return this.motion.remainingActiveMs(this.sentenceMotion, time);
    }

    return Math.max(0, this.activeRoundDurationMs - (time - this.roundStartedAt));
  }

  private nowMs(): number {
    return this.activeNowMs(this.baseNowMs());
  }

  private baseNowMs(): number {
    return sceneClockNow(this.game.loop.now, this.time.now);
  }

  private activeNowMs(time: number): number {
    if (
      import.meta.env.DEV &&
      this.qaControls.freezeElapsedMs !== undefined &&
      this.round > 0 &&
      !this.resolving
    ) {
      return this.roundStartedAt + this.qaControls.freezeElapsedMs;
    }

    return time;
  }

  private fitTextFontSize(panelWidth: number, compact: boolean): number {
    const maxSize = compact ? 26 : 36;
    const minSize = compact ? 18 : 22;
    const length = this.currentFixture ? displayLength(this.currentFixture.text) : 24;
    return Math.max(minSize, Math.min(maxSize, Math.floor(((panelWidth - 56) / Math.max(1, length)) * 1.55)));
  }

  private addTrailPoint(x: number, y: number): void {
    if (this.resolving) {
      this.hideActiveTrail();
      return;
    }

    this.trailFadeTween?.stop();
    this.trailFadeTween = undefined;
    this.trailGraphics.setAlpha(1);
    this.trailPoints = appendTrailPoint(this.trailPoints, { x, y });
    this.drawTrail();
  }

  private drawTrail(): void {
    if (this.resolving) {
      this.hideActiveTrail();
      return;
    }

    this.trailGraphics.clear();
    if (this.trailPoints.length < 2) {
      return;
    }

    this.trailGraphics.setVisible(true);
    for (const segment of buildOrangeBrushTrailSegments(this.trailPoints)) {
      this.trailGraphics.lineStyle(segment.width, segment.color, segment.alpha);
      new Phaser.Curves.Path(segment.from.x, segment.from.y)
        .quadraticBezierTo(segment.to.x, segment.to.y, segment.control.x, segment.control.y)
        .draw(this.trailGraphics, 10);
    }
  }

  private clearTrail(): void {
    this.trailFadeTween?.stop();
    this.trailFadeTween = undefined;
    this.trailPoints = [];
    this.trailGraphics?.clear();
    this.trailGraphics?.setAlpha(1);
    this.clearArmedCutPreview();
  }

  private hideActiveTrail(): void {
    this.clearTrail();
    this.trailGraphics?.setVisible(false);
  }

  private showActiveTrail(): void {
    this.trailGraphics?.setVisible(true);
  }

  private playPetReaction(plan: WienerReactionPlan | null): void {
    if (!plan || !this.petWiener) {
      return;
    }

    this.petReactionTween?.stop();
    this.petReactionTween = undefined;
    const baseScaleX = this.petWienerBaseScaleX;
    const baseScaleY = this.petWienerBaseScaleY;
    this.petWiener.setAngle(0);
    this.petWiener.setX(this.petWienerBaseX);
    this.petWiener.setScale(baseScaleX, baseScaleY);
    this.petReactionKind = plan.kind;
    this.petReactionPeakScaleX = plan.scaleX;
    this.petReactionPeakScaleY = plan.scaleY;
    this.petReactionTween = this.tweens.add({
      targets: this.petWiener,
      x: this.petWienerBaseX + plan.xOffset,
      angle: plan.angle,
      scaleX: baseScaleX * plan.scaleX,
      scaleY: baseScaleY * plan.scaleY,
      duration: plan.durationMs,
      yoyo: plan.yoyo,
      repeat: plan.repeat,
      ease: plan.ease,
      onComplete: () => {
        this.petWiener.setAngle(0);
        this.petWiener.setX(this.petWienerBaseX);
        this.petWiener.setScale(baseScaleX, baseScaleY);
        this.petReactionTween = undefined;
        this.writePlayQaSnapshot();
      }
    });
    this.writePlayQaSnapshot();
  }

  private clearPetReaction(): void {
    this.petReactionTween?.stop();
    this.petReactionTween = undefined;
    this.petWiener?.setAngle(0);
    this.petWiener?.setX(this.petWienerBaseX);
    if (this.petWiener) {
      this.petWiener.setScale(this.petWienerBaseScaleX, this.petWienerBaseScaleY);
    }
    this.petReactionKind = null;
    this.petReactionPeakScaleX = 1;
    this.petReactionPeakScaleY = 1;
  }

  private normalizedPetReactionScaleX(): number {
    return this.petWienerBaseScaleX === 0 ? 1 : this.petWiener.scaleX / this.petWienerBaseScaleX;
  }

  private normalizedPetReactionScaleY(): number {
    return this.petWienerBaseScaleY === 0 ? 1 : this.petWiener.scaleY / this.petWienerBaseScaleY;
  }

  private restartPetIdleBob(): void {
    this.petIdleTween?.stop();
    this.petIdleTween = undefined;
    this.petWiener.setY(this.petWienerBaseY);
    this.petIdleTween = this.tweens.add({
      targets: this.petWiener,
      y: this.petWienerBaseY - 5,
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private clearPetIdleBob(): void {
    this.petIdleTween?.stop();
    this.petIdleTween = undefined;
    this.petWiener?.setY(this.petWienerBaseY);
  }

  private drawAssistantGlyph(): void {
    this.assistantGlyph.clear();
  }

  private layoutPetWiener(layout: ReturnType<typeof computePlayLayout>): void {
    let petY = layout.assistantPanel.y;
    if (this.resolving && !layout.compact) {
      const petHeight = layout.assistantPanel.height;
      const feedback = computeFeedbackCardLayout(this.scale.width, this.scale.height, layout.contentPanel);
      const feedbackTop = feedback.y - feedback.height / 2;
      const evidenceTop = this.tokenEvidenceRect
        ? this.tokenEvidenceRect.y - this.tokenEvidenceRect.height / 2
        : Number.POSITIVE_INFINITY;
      const playfieldTop = layout.playfield.y - layout.playfield.height / 2;
      const minY = playfieldTop + petHeight / 2 + 18;
      const maxY = Math.min(
        feedbackTop - 10 - petHeight / 2,
        evidenceTop - 12 - petHeight / 2
      );
      petY = Math.max(minY, Math.min(petY, maxY));
    }

    this.petWiener.setVisible(true);
    this.petWienerBaseX = layout.assistantPanel.x;
    this.petWienerBaseY = petY;
    this.petWiener.setPosition(layout.assistantPanel.x, petY);
    sizeWienerImage(this.petWiener, layout.assistantPanel.height);
    this.petWienerBaseScaleX = this.petWiener.scaleX;
    this.petWienerBaseScaleY = this.petWiener.scaleY;
    this.restartPetIdleBob();
  }

  private layoutAssistantArtifact(layout: ReturnType<typeof computePlayLayout>): void {
    const visible = layout.sideAssistant;
    this.assistantPanel.setVisible(visible);
    this.assistantPanelChrome.setVisible(visible);
    this.assistantHeaderText.setVisible(visible);
    this.assistantNameText.setVisible(visible);
    this.assistantNoteText.setVisible(visible);
    this.assistantText.setVisible(visible);
    this.assistantGlyph.setVisible(visible);
    this.assistantGlyph.clear();
    this.assistantPanelChrome.clear();

    if (!visible) {
      return;
    }

    this.assistantPanel.setPosition(layout.assistantPanel.x, layout.assistantPanel.y);
    this.assistantPanel.setSize(layout.assistantPanel.width, layout.assistantPanel.height);
    this.drawAssistantPanelChrome(layout);
    this.assistantHeaderText.setPosition(layout.assistantText.x, layout.assistantText.y + 4);
    this.assistantNameText.setPosition(layout.assistantText.x + 98, layout.assistantText.y + 58);
    this.assistantNoteText.setPosition(layout.assistantText.x + 98, layout.assistantText.y + 80);
    this.assistantNoteText.setWordWrapWidth(layout.assistantPanel.width - 132);
    this.assistantText.setPosition(layout.assistantText.x, layout.assistantText.y + 186);
    this.assistantText.setWordWrapWidth(layout.assistantPanel.width - 30);
    this.refreshAssistantArtifact();
  }

  private refreshAssistantArtifact(): void {
    if (!this.assistantPanel?.visible) {
      return;
    }

    const mood = this.wienerMood();
    this.assistantNoteText.setText(this.assistantNoteForMood(mood));
    this.assistantText.setText(this.assistantPanelText());
    this.drawAssistantGlyph();
  }

  private assistantPanelText(): string {
    const accuracy = this.totalPossible <= 0 ? 100 : Math.round((this.totalCorrect / this.totalPossible) * 100);
    const payRate = this.round <= 1 ? 0.15 : Math.max(0, this.totalPay / Math.max(1, this.round - 1));

    return [
      "TRUST LEVEL: LOW",
      "",
      "ACCURACY",
      `${accuracy}%`,
      "PAY RATE",
      `$${payRate.toFixed(2)} / round`,
      "",
      "SUPERVISOR NOTES",
      this.balance <= 10 ? "Finance is circling." : "Accuracy extends the shift.",
      this.tutorialMode ? "Training route active." : "Token boundaries drive the bill."
    ].join("\n");
  }

  private assistantNoteForMood(mood: WienerMood): string {
    if (mood === "alarm") {
      return "Finance is circling.";
    }

    if (mood === "disappointed") {
      return "Very peaceful. Very wrong.";
    }

    if (mood === "snark") {
      return "The ledger has opinions.";
    }

    if (mood === "teaching") {
      return "Boundary evidence first.";
    }

    if (mood === "idle") {
      return "Payroll is waiting.";
    }

    return "Human segmentation assigned.";
  }

  private activeCutPulseKindsForQa(): ActiveCutPulseKind[] {
    return [...this.activeCutPulseStartedAt.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, pulse]) => pulse.kind);
  }

  private drawAssistantPanelChrome(layout: ReturnType<typeof computePlayLayout>): void {
    const panel = layout.assistantPanel;
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    const right = left + panel.width;
    const bottom = top + panel.height;

    this.assistantPanelChrome.clear();
    this.assistantPanelChrome.fillStyle(uiPalette.panelTint, 0.7);
    this.assistantPanelChrome.fillRect(left + 1, top + 1, panel.width - 2, 34);
    this.assistantPanelChrome.lineStyle(1, uiPalette.stroke, 0.8);
    this.assistantPanelChrome.lineBetween(left + 12, top + 35, right - 12, top + 35);
    this.assistantPanelChrome.lineBetween(left + 12, top + 174, right - 12, top + 174);
    this.assistantPanelChrome.lineBetween(left + 12, top + 296, right - 12, top + 296);
    this.assistantPanelChrome.lineBetween(left + 12, bottom - 92, right - 12, bottom - 92);
    this.assistantPanelChrome.fillStyle(uiPalette.strokeDark, 0.2);
    this.assistantPanelChrome.fillRect(left + 106, top + 136, panel.width - 126, 4);
    this.assistantPanelChrome.fillStyle(uiPalette.strokeDark, 0.62);
    this.assistantPanelChrome.fillRect(left + 106, top + 136, Math.max(26, panel.width - 172), 4);
    this.assistantPanelChrome.fillStyle(uiPalette.oxidizedGreen, 0.68);
    this.assistantPanelChrome.fillCircle(right - 32, bottom - 42, 5);
    this.assistantPanelChrome.fillCircle(right - 18, bottom - 42, 5);
  }

  private wienerMood(): WienerMood {
    if (this.balance <= 10) {
      return "alarm";
    }

    if (this.resolving && this.lastCost > this.lastPay) {
      return "disappointed";
    }

    if (this.currentCuts.length >= 6) {
      return "snark";
    }

    if (this.tutorialMode) {
      return "teaching";
    }

    if (!this.currentFixture) {
      return "idle";
    }

    return "neutral";
  }

  private moveSentenceToReviewPosition(): void {
    const layout = computePlayLayout({ width: this.scale.width, height: this.scale.height });
    this.sentenceMotion = undefined;
    this.layoutPetWiener(layout);
    this.setSentenceY(layout.sentenceReviewY);
  }

  private showTokenStrip(fixture: TokenFixture, score?: RoundScoreResult): void {
    const draftLayout = segmentationEvidenceLayout({
      viewport: { width: this.scale.width, height: this.scale.height },
      textPanel: this.qaRectFromBounds(this.textPanel.getBounds()),
      compact: this.compactLayout,
      lineCount: 2
    });
    this.tokenStripText.setText(segmentationEvidenceText(fixture.token_strings, {
      compact: this.compactLayout,
      maxCharsPerRow: draftLayout.maxCharsPerRow,
      submittedCutCount: this.currentCuts.length,
      truthBoundaryCount: fixture.boundary_positions.length,
      correctCutCount: score?.correctCuts.length,
      missedCutCount: score?.missedCuts.length,
      falseCutCount: score?.falseCuts.length
    }));
    this.tokenStripText.setVisible(false);
    this.tokenStripText.setAlpha(1);
    this.segmentationEvidenceRevealStartedAt = undefined;
    this.tokenEvidenceChrome?.clear();
    this.tokenEvidenceChrome?.setVisible(false);
    this.tokenEvidenceRect = undefined;
    if (this.resolving) {
      this.layoutPetWiener(computePlayLayout({ width: this.scale.width, height: this.scale.height }));
      this.layoutRobotToast();
    }
  }

  private updateSegmentationEvidenceReveal(): void {
    if (this.segmentationEvidenceRevealStartedAt === undefined || !this.tokenStripText.visible) {
      return;
    }

    const reveal = this.currentSegmentationEvidenceRevealState();
    this.layoutSegmentationEvidence();
    if (!reveal.active) {
      this.segmentationEvidenceRevealStartedAt = undefined;
    }
  }

  private currentSegmentationEvidenceRevealState(): SegmentationEvidenceRevealState {
    return segmentationEvidenceRevealState({
      elapsedMs: this.segmentationEvidenceRevealStartedAt === undefined
        ? null
        : this.baseNowMs() - this.segmentationEvidenceRevealStartedAt
    });
  }

  private clearSegmentationEvidenceReveal(): void {
    this.segmentationEvidenceRevealStartedAt = undefined;
    this.tokenStripText?.setAlpha(1);
  }

  private toggleMute(): void {
    const muted = this.audio.toggleMuted();
    this.haptics.setMuted(muted);
    this.storage.saveMuted(muted);
    this.updateMuteLabel();
    if (!muted) {
      this.audio.play("ui");
    }
  }

  private updateMuteLabel(): void {
    this.muteLabel?.setText(this.audio.isMuted() ? "Muted" : "Sound");
  }

  private updateResolveButtonState(): void {
    this.applyResolveButtonVisualState(false);
  }

  private applyResolveButtonVisualState(hovered: boolean, pressed = false): void {
    if (this.resolving && this.tutorialMode) {
      const finalRound = this.tutorial.isCompleteAfter(this.round);
      const ready = this.tutorialReviewCanAdvance();
      this.resolveLabel?.setText(ready ? finalRound ? "Finish" : "Continue" : "Review");
      this.resolveButton?.setAlpha(ready ? 1 : 0.72);
      this.resolveButton?.setFillStyle(
        ready
          ? pressed ? buttonVisual.pressFill : hovered ? buttonVisual.hoverFill : buttonVisual.fill
          : buttonVisual.disabledFill,
        ready
          ? pressed ? buttonVisual.pressAlpha : hovered ? buttonVisual.hoverAlpha : buttonVisual.fillAlpha
          : buttonVisual.disabledAlpha
      );
      this.resolveButton?.setStrokeStyle(1, buttonVisual.stroke, ready ? 0.78 : 0.62);
      return;
    }

    const ready = !this.resolving && this.currentCuts.length > 0;
    const deadlinePressure = this.resolveDeadlinePressure();
    const state = resolveButtonVisualState(
      this.resolving,
      hovered,
      this.compactLayout,
      ready,
      pressed,
      this.currentCuts.length,
      this.resolveReadyPulseStartedAt === undefined ? undefined : this.baseNowMs() - this.resolveReadyPulseStartedAt,
      deadlinePressure
    );
    this.resolveLabel?.setText(state.label);
    this.resolveButton?.setAlpha(state.alpha);
    this.resolveButton?.setFillStyle(state.fillColor, state.fillAlpha);
    this.resolveButton?.setStrokeStyle(state.strokeWidth, state.strokeColor, state.strokeAlpha);
  }

  private startResolveReadyPulse(): void {
    this.resolveReadyPulseStartedAt = this.baseNowMs();
  }

  private updateResolveReadyPulse(): void {
    if (this.resolveReadyPulseStartedAt === undefined) {
      return;
    }

    if (this.baseNowMs() - this.resolveReadyPulseStartedAt >= RESOLVE_READY_PULSE_MS) {
      this.resolveReadyPulseStartedAt = undefined;
    }

    this.updateResolveButtonState();
  }

  private updateResolveDeadlinePressure(): void {
    const active = this.resolveDeadlinePressure() > 0;
    if (!active && !this.resolveDeadlinePressureWasActive) {
      return;
    }

    this.resolveDeadlinePressureWasActive = active;
    this.updateResolveButtonState();
  }

  private resolveDeadlinePressure(): number {
    if (this.tutorialMode || this.resolving) {
      return 0;
    }

    const timerPressure = this.currentTimerPressureState(this.nowMs());
    if (!timerPressure.warningActive) {
      return 0;
    }

    return Math.max(0, Math.min(1, timerPressure.warningIntensity * 0.72 + timerPressure.pulseStrength * 0.28));
  }

  private updateClearButtonState(): void {
    this.applyClearButtonVisualState(false);
  }

  private applyClearButtonVisualState(hovered: boolean, pressed = false): void {
    const canClear = this.clearButtonActionable();
    const state = clearButtonVisualState(canClear, hovered, pressed);
    this.clearLabel?.setText(clearButtonLabel(this.compactLayout, this.currentCuts.length, canClear));
    this.clearButton?.setAlpha(state.alpha);
    this.clearButton?.setFillStyle(state.fillColor, state.fillAlpha);
    if (this.clearButton?.input) {
      this.clearButton.input.cursor = canClear ? "pointer" : false;
    }
    if (!canClear) {
      this.input.resetCursor();
    }
  }

  private clearPlayerCuts(): void {
    if (this.resolving || this.currentCuts.length === 0) {
      return;
    }

    const clearedCutCount = this.currentCuts.length;
    this.playClearCutFeedback(this.currentCuts);
    this.haptics.play("clear", this.inputModality);
    this.clearChainSwipeFeedback();
    this.clearNoCutFeedback();
    this.currentCuts = [];
    this.inputFeelMetrics.endGesture();
    this.gestureAddedCuts.clear();
    this.gestureReleaseSampleCuts.clear();
    this.gestureTouchedExistingCuts.clear();
    this.gestureNoCutPreview = undefined;
    this.clearActiveCutMarkers();
    this.clearTextCutImpact();
    this.clearInputResponseBadge();
    this.clearTrail();
    this.resolveReadyPulseStartedAt = undefined;
    this.renderCutStatus();
    this.updateResolveButtonState();
    this.updateClearButtonState();
    this.refreshAssistantArtifact();
    this.refreshTrainingFooter();
    this.writePlayQaSnapshot();
    if (clearedCutCount > 0) {
      this.audio.play("clear");
    }
  }

  private exitToMenu(): void {
    this.audio.play("ui");
    const transition = this.sessionFlow.exitTransition({
      tutorialMode: this.tutorialMode,
      balance: this.balance
    });
    this.tutorialPromptTimer?.remove(false);
    this.tutorialMechanicsTimer?.remove(false);
    this.tutorialByteTimer?.remove(false);
    this.tutorialTokenIdTimer?.remove(false);
    this.tutorialRuleTimer?.remove(false);
    this.tutorialFollowupTimer?.remove(false);
    this.tutorialReviewPanelTimer?.remove(false);
    this.robotToastTimer?.remove(false);
    this.tutorialPopupTimer?.remove(false);
    this.feedbackAdvanceTimer?.remove(false);
    this.clearReviewRevealTimers();
    this.clearResolutionRevealTimers();
    this.clearFallingTextPieces();
    this.clearPetReaction();
    this.clearPetIdleBob();
    this.clearTextCutImpact();
    this.clearResolveCommitBeat();
    this.clearClearCutFeedback();
    this.clearChainSwipeFeedback();
    this.clearNoCutFeedback();
    this.clearPromptAcquisitionBeat();
    this.audio.cancelPending();
    if (transition.type === "results") {
      this.endSession(transition.outcome);
      return;
    }

    this.scene.start("MenuScene");
  }

  private layoutExitButton(layout: ReturnType<typeof computePlayLayout>): void {
    this.exitButton.setSize(layout.exitButton.width, layout.exitButton.height);
    this.exitButton.setPosition(layout.exitButton.x, layout.exitButton.y);
    this.exitLabel.setText(exitButtonLabel(layout.compact, this.tutorialMode));
    this.exitLabel.setPosition(layout.exitButton.x, layout.exitButton.y);
  }

  private resetSessionStats(): void {
    this.balance = 40;
    this.round = 0;
    this.lastPay = 0;
    this.lastCost = 0;
    this.totalPay = 0;
    this.totalCost = 0;
    this.totalCorrect = 0;
    this.totalMissed = 0;
    this.totalFalse = 0;
    this.totalPossible = 0;
    this.roundTraces = [];
    this.inputModality = "none";
  }

  private shutdownScene(): void {
    this.unregisterFocusPauseListeners();
    this.focusPauseRequested = false;
    this.tutorialPromptTimer?.remove(false);
    this.tutorialMechanicsTimer?.remove(false);
    this.tutorialByteTimer?.remove(false);
    this.tutorialTokenIdTimer?.remove(false);
    this.tutorialRuleTimer?.remove(false);
    this.tutorialFollowupTimer?.remove(false);
    this.robotToastTimer?.remove(false);
    this.tutorialPopupTimer?.remove(false);
    this.feedbackAdvanceTimer?.remove(false);
    this.clearReviewRevealTimers();
    this.clearResolutionRevealTimers();
    this.clearFallingTextPieces();
    this.clearPetReaction();
    this.clearPetIdleBob();
    this.clearTextCutImpact();
    this.clearResolveCommitBeat();
    this.clearClearCutFeedback();
    this.clearChainSwipeFeedback();
    this.clearNoCutFeedback();
    this.clearPromptAcquisitionBeat();
    this.audio.cancelPending();
    this.clearCutMarkers();
    this.clearActiveCutMarkers();
    this.clearSlotHints();
    this.clearTrail();
    this.inputFeelMetrics.endGesture();
    clearGameQaSnapshot();
    this.input.off("pointerdown", this.handlePointer, this);
    this.input.off("pointermove", this.handlePointer, this);
    this.input.off("pointerup", this.handlePointerGestureEnd, this);
    this.input.off("pointerupoutside", this.handlePointerGestureEnd, this);
    this.input.off("gameout", this.handlePointerGestureEnd, this);
    this.input.keyboard?.off("keydown-ENTER", this.handleKeyboardResolve, this);
    this.input.keyboard?.off("keydown-SPACE", this.handleKeyboardResolve, this);
    this.input.keyboard?.off("keydown-BACKSPACE", this.handleKeyboardClear, this);
    this.input.keyboard?.off("keydown-DELETE", this.handleKeyboardClear, this);
    this.input.keyboard?.off("keydown-M", this.handleKeyboardMute, this);
    this.input.keyboard?.off("keydown-ESC", this.handleKeyboardExit, this);
    this.scale.off("resize", this.layout, this);
  }
}
