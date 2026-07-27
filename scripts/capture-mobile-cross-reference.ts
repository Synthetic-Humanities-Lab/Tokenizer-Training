import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer, type ViteDevServer } from "vite";
import type { Browser, BrowserContext, Page } from "playwright";
import {
  evaluateMobileCrossReference,
  renderMobileCrossReferenceEvaluation
} from "./evaluate-mobile-cross-reference";

type JsonRecord = Record<string, unknown>;

export interface CaptureRoute {
  id: string;
  file: string;
  width: number;
  height: number;
  params: Record<string, string>;
  mobileInput?: boolean;
}

interface CaptureOptions {
  baseUrl?: string;
  port: number;
  outRoot: string;
  skipRuntime: boolean;
}

const QA_SNAPSHOT_ID = "tokenizer-training-qa";
const QA_CANVAS_CHUNKS_ID = "tokenizer-training-canvas-qa-chunks";
const targetBoundaries = [3, 7, 11, 14, 18] as const;

export const menuCaptureRoutes: CaptureRoute[] = [
  {
    id: "browser-desktop-menu",
    file: "browser-desktop-menu.png",
    width: 1280,
    height: 720,
    params: { playtestReset: "1", qaViewport: "1280x720" }
  },
  {
    id: "browser-compact-menu",
    file: "browser-compact-menu.png",
    width: 368,
    height: 552,
    params: { playtestReset: "1", qaViewport: "368x552" }
  },
  {
    id: "mobile-surface-menu",
    file: "mobile-surface-menu.png",
    width: 368,
    height: 552,
    params: { surface: "mobile", playtestReset: "1", qaViewport: "368x552" },
    mobileInput: true
  },
  {
    id: "mobile-surface-menu-tall",
    file: "mobile-surface-menu-tall.png",
    width: 368,
    height: 800,
    params: { surface: "mobile", playtestReset: "1", qaViewport: "368x800" },
    mobileInput: true
  }
];

export const surfaceCaptureRoutes: CaptureRoute[] = [
  {
    id: "browser-desktop-tutorial-active-fresh",
    file: "browser-desktop-tutorial-active-fresh.png",
    width: 1280,
    height: 720,
    params: {
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "1280x720",
      qaFreezeElapsedMs: "6200",
      qaCanvasCapture: "1"
    }
  },
  {
    id: "mobile-surface-tutorial-active-small-fresh",
    file: "mobile-surface-tutorial-active-small-fresh.png",
    width: 368,
    height: 552,
    params: {
      surface: "mobile",
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaCanvasCapture: "1"
    },
    mobileInput: true
  },
  {
    id: "mobile-surface-tutorial-active-large-after",
    file: "mobile-surface-tutorial-active-large-after.png",
    width: 390,
    height: 844,
    params: {
      surface: "mobile",
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "390x844",
      qaFreezeElapsedMs: "6200",
      qaCanvasCapture: "1"
    },
    mobileInput: true
  },
  {
    id: "browser-desktop-endless-pinned-simple-001",
    file: "browser-desktop-endless-pinned-simple-001.png",
    width: 1280,
    height: 720,
    params: {
      mode: "endless",
      playtestReset: "1",
      qaViewport: "1280x720",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001",
      qaCanvasCapture: "1"
    }
  },
  {
    id: "mobile-surface-endless-pinned-simple-001",
    file: "mobile-surface-endless-pinned-simple-001.png",
    width: 368,
    height: 552,
    params: {
      surface: "mobile",
      mode: "endless",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001",
      qaCanvasCapture: "1"
    },
    mobileInput: true
  },
  {
    id: "mobile-surface-results-small-after",
    file: "mobile-surface-results-small-after.png",
    width: 368,
    height: 552,
    params: {
      surface: "mobile",
      mode: "protocol-results",
      playtestReset: "1",
      qaViewport: "368x552"
    },
    mobileInput: true
  }
];

export function parseMobileCrossReferenceCaptureArgs(args: string[]): CaptureOptions {
  return {
    baseUrl: valueForFlag(args, "--base-url"),
    port: numberForFlag(args, "--port") ?? 5173,
    outRoot: valueForFlag(args, "--out-root") ?? ".qa",
    skipRuntime: args.includes("--skip-runtime")
  };
}

export async function captureMobileCrossReferenceArtifacts(options: CaptureOptions): Promise<void> {
  const server = await startServerIfNeeded(options);
  const baseUrl = normalizeBaseUrl(server.baseUrl);
  let browser: Browser | undefined;

  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    await captureMenuComparison(browser, baseUrl, options.outRoot);
    await captureSurfaceEvidence(browser, baseUrl, options.outRoot);
    if (!options.skipRuntime) {
      await captureRuntimeEvidence(browser, baseUrl, options.outRoot);
    }
  } catch (error) {
    throw new Error(captureFailureMessage(error));
  } finally {
    await browser?.close();
    await server.close();
  }
}

async function captureMenuComparison(browser: Browser, baseUrl: string, outRoot: string): Promise<void> {
  const directory = prepareDirectory(join(outRoot, "iab-surface-compare/latest"));
  const entries: JsonRecord[] = [];

  for (const route of menuCaptureRoutes) {
    const capture = await captureRoute(browser, baseUrl, route, directory);
    entries.push({
      id: route.id,
      url: capture.url,
      viewport: { width: route.width, height: route.height },
      file: capture.imagePath,
      snapshot: capture.snapshot
    });
  }

  writeJson(join(directory, "comparison.json"), entries);
}

async function captureSurfaceEvidence(browser: Browser, baseUrl: string, outRoot: string): Promise<void> {
  const directory = prepareDirectory(join(outRoot, "mobile-port-audit/latest"));

  for (const route of surfaceCaptureRoutes) {
    const capture = await captureRoute(browser, baseUrl, route, directory);
    writeJson(join(directory, `${route.id}.json`), {
      summary: summaryFromSnapshot(route.id, capture.url, capture.snapshot, capture.canvasCapture, capture.imageBytes),
      pageCapture: {
        snapshot: capture.snapshot
      }
    });
  }
}

async function captureRuntimeEvidence(browser: Browser, baseUrl: string, outRoot: string): Promise<void> {
  const directory = prepareDirectory(join(outRoot, "mobile-runtime/latest"));
  await captureTutorialRuntime(browser, baseUrl, directory);
  await captureEndlessRuntime(browser, baseUrl, directory);
  await captureHeldReviewRuntime(browser, baseUrl, directory);
}

async function captureTutorialRuntime(browser: Browser, baseUrl: string, directory: string): Promise<void> {
  const page = await newCapturedPage(browser, { width: 368, height: 552, mobileInput: true });
  try {
    const url = urlWithParams(baseUrl, {
      surface: "mobile",
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaCanvasCapture: "1"
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const initial = await waitForQaSnapshot(page, (snapshot) => stateString(snapshot, "phase") === "active", "tutorial active");
    const targetSlots = targetSlotRects(initial);
    const loupePreview = await captureTouchAssistPreview(page, initial, "tutorial touch assist preview");
    await tapTargetSlots(page, initial);
    const afterCuts = await waitForQaSnapshot(page, (snapshot) => stateNumber(snapshot, "cutCount") === 5, "tutorial cuts");
    await tapElement(page, afterCuts, "resolveButton");
    const afterResolve = await waitForQaSnapshot(
      page,
      (snapshot) => (
        stateString(snapshot, "phase") === "review"
        && stateBoolean(snapshot, "feedbackVisible") === true
        && rectOf(snapshot, "feedbackCard") !== undefined
        && rectOf(snapshot, "feedbackTokenSplit") !== undefined
        && elementText(snapshot, "feedbackCard").trim().length > 0
      ),
      "tutorial review evidence",
      15_000
    );
    await screenshotWithQaSidecar(page, join(directory, "cua-flow-review.png"), afterResolve);

    writeJson(join(directory, "cua-flow-result.json"), {
      targetSlots,
      loupePreview: activeRuntimeState(loupePreview),
      afterCuts: activeRuntimeState(afterCuts),
      afterResolve: reviewRuntimeState(afterResolve)
    });
  } finally {
    await page.context().close();
  }
}

async function captureEndlessRuntime(browser: Browser, baseUrl: string, directory: string): Promise<void> {
  const page = await newCapturedPage(browser, { width: 368, height: 552, mobileInput: true });
  try {
    const url = urlWithParams(baseUrl, {
      surface: "mobile",
      mode: "endless",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001",
      qaCanvasCapture: "1"
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const initial = await waitForQaSnapshot(page, (snapshot) => stateString(snapshot, "phase") === "active", "endless active");
    const loupePreview = await captureTouchAssistPreview(page, initial, "endless touch assist preview");
    await tapTargetSlots(page, initial);
    const afterCuts = await waitForQaSnapshot(page, (snapshot) => stateNumber(snapshot, "cutCount") === 5, "endless cuts");
    await tapElement(page, afterCuts, "resolveButton");
    const review = await waitForQaSnapshot(
      page,
      (snapshot) => (
        stateString(snapshot, "phase") === "review"
        && stateBoolean(snapshot, "rendererQaCapture") === true
        && stateString(snapshot, "rendererQaCaptureStatus") === "ok"
      ),
      "endless review renderer capture",
      15_000
    );
    await screenshotWithQaSidecar(page, join(directory, "cua-endless-review-clean.png"), review);
    const autoNext = await waitForQaSnapshot(
      page,
      (snapshot) => stateString(snapshot, "phase") === "active" && stateNumber(snapshot, "round") === 2,
      "endless auto-next",
      10_000
    );
    await screenshotWithQaSidecar(page, join(directory, "cua-endless-auto-check-next-round.png"), autoNext);

    const result = {
      url,
      targetBoundaries,
      targetSlots: targetSlotCenters(initial),
      initial: activeRuntimeState(initial),
      loupePreview: activeRuntimeState(loupePreview),
      afterCuts: activeRuntimeState(afterCuts),
      review: {
        ...reviewRuntimeState(review),
        rendererQaCapture: stateBoolean(review, "rendererQaCapture"),
        rendererQaCaptureStatus: stateString(review, "rendererQaCaptureStatus"),
        canvasCapture: await readCanvasCapture(page)
      },
      autoNext: activeRuntimeState(autoNext),
      artifacts: ["cua-endless-review-clean.png", "cua-endless-auto-check-next-round.png"]
    };

    writeJson(join(directory, "cua-endless-flow-clean-result.json"), result);
    writeJson(join(directory, "cua-endless-auto-check-result.json"), {
      url,
      afterCuts: activeRuntimeState(afterCuts),
      reviewWindow: reviewRuntimeState(review),
      autoNext: activeRuntimeState(autoNext),
      artifacts: ["cua-endless-auto-check-next-round.png"]
    });
  } finally {
    await page.context().close();
  }
}

async function captureHeldReviewRuntime(browser: Browser, baseUrl: string, directory: string): Promise<void> {
  const page = await newCapturedPage(browser, { width: 368, height: 552, mobileInput: true });
  try {
    const url = urlWithParams(baseUrl, {
      surface: "mobile",
      mode: "endless",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001",
      qaHoldReview: "1",
      qaCanvasCapture: "1"
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const initial = await waitForQaSnapshot(page, (snapshot) => stateString(snapshot, "phase") === "active", "held active");
    await tapTargetSlots(page, initial);
    const afterCuts = await waitForQaSnapshot(page, (snapshot) => stateNumber(snapshot, "cutCount") === 5, "held cuts");
    await tapElement(page, afterCuts, "resolveButton");
    const review = await waitForQaSnapshot(
      page,
      (snapshot) => (
        stateString(snapshot, "phase") === "review"
        && rectOf(snapshot, "feedbackCard") !== undefined
        && rectOf(snapshot, "feedbackTokenSplit") !== undefined
        && elementText(snapshot, "feedbackCard").trim().length > 0
      ),
      "held review feedback",
      15_000
    );
    const heldReviewPath = join(directory, "cua-endless-review-held-tight.png");
    const readableFeedbackPath = join(directory, "cua-feedback-card-readable-phone.png");
    await screenshotWithQaSidecar(page, heldReviewPath, review);
    copyFileSync(heldReviewPath, readableFeedbackPath);
    copyFileSync(qaSidecarPath(heldReviewPath), qaSidecarPath(readableFeedbackPath));

    const heldResult = {
      url,
      afterCuts: activeRuntimeState(afterCuts),
      review: reviewRuntimeState(review),
      artifacts: ["cua-endless-review-held-tight.png"]
    };

    writeJson(join(directory, "cua-endless-review-held-tight-result.json"), heldResult);
    writeJson(join(directory, "cua-feedback-card-readable-phone-result.json"), {
      url,
      browserViewport: { width: 368, height: 552 },
      ...reviewRuntimeState(review),
      limitations: {
        partialCutRun: true,
        purpose: "targeted mobile feedback-card readability geometry from autonomous browser/mobile capture"
      }
    });
  } finally {
    await page.context().close();
  }
}

async function captureRoute(
  browser: Browser,
  baseUrl: string,
  route: CaptureRoute,
  directory: string
): Promise<{ url: string; imagePath: string; imageBytes: number; snapshot: JsonRecord; canvasCapture: JsonRecord | null }> {
  const page = await newCapturedPage(browser, route);
  const url = urlWithParams(baseUrl, route.params);
  let snapshot: JsonRecord | null = null;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    snapshot = await waitForQaSnapshot(page, () => true, route.id);
    const imagePath = join(directory, route.file);
    const imageBytes = await screenshot(page, imagePath);
    const canvasCapture = await readCanvasCapture(page);
    return { url, imagePath, imageBytes, snapshot, canvasCapture };
  } catch (error) {
    await writeCaptureRouteFailureArtifact(directory, route, url, page, snapshot, error);
    throw error;
  } finally {
    await page.context().close();
  }
}

export function captureRouteFailureArtifactPaths(
  directory: string,
  route: Pick<CaptureRoute, "id" | "file">
): { json: string; screenshot: string } {
  return {
    json: join(directory, `${route.id}.failure.json`),
    screenshot: join(directory, `${route.file.replace(/\.[^.]+$/, "")}.failure.png`)
  };
}

export function captureRouteFailureRecord(input: {
  route: Pick<CaptureRoute, "id" | "file" | "width" | "height" | "params" | "mobileInput">;
  url: string;
  error: unknown;
  snapshot: JsonRecord | null;
  screenshot: { path: string; bytes?: number; error?: string };
}): JsonRecord {
  return {
    routeCaptureFailure: true,
    id: input.route.id,
    url: input.url,
    file: input.route.file,
    viewport: { width: input.route.width, height: input.route.height },
    mobileInput: input.route.mobileInput === true,
    params: input.route.params,
    error: errorMessage(input.error),
    snapshotSummary: snapshotSummary(input.snapshot),
    screenshot: input.screenshot
  };
}

async function writeCaptureRouteFailureArtifact(
  directory: string,
  route: CaptureRoute,
  url: string,
  page: Page,
  snapshot: JsonRecord | null,
  error: unknown
): Promise<void> {
  const paths = captureRouteFailureArtifactPaths(directory, route);
  const screenshotResult: { path: string; bytes?: number; error?: string } = { path: paths.screenshot };

  try {
    screenshotResult.bytes = await screenshot(page, paths.screenshot);
  } catch (screenshotError) {
    screenshotResult.error = errorMessage(screenshotError);
  }

  writeJson(paths.json, captureRouteFailureRecord({
    route,
    url,
    error,
    snapshot,
    screenshot: screenshotResult
  }));
}

async function newCapturedPage(
  browser: Browser,
  route: Pick<CaptureRoute, "width" | "height" | "mobileInput">
): Promise<Page> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: route.width, height: route.height },
    deviceScaleFactor: 1,
    hasTouch: route.mobileInput === true,
    isMobile: route.mobileInput === true,
    reducedMotion: "reduce"
  });
  return context.newPage();
}

async function captureTouchAssistPreview(page: Page, snapshot: JsonRecord, label: string): Promise<JsonRecord> {
  const boundary = targetBoundaries[0];
  const point = interactionPoint(snapshot, `playableSlot:${boundary}`) ?? centerOfRect(rectOf(snapshot, `playableSlot:${boundary}`));
  if (!point) {
    throw new Error(`Missing interaction point for touch assist preview boundary ${boundary}.`);
  }

  await page.mouse.move(point.x, point.y);
  return waitForQaSnapshot(
    page,
    (candidate) => (
      stateBoolean(candidate, "touchAimLoupeVisible") === false
      && stateBoolean(candidate, "armedPreviewReady") === true
      && stateNumber(candidate, "armedPreviewBoundary") === boundary
    ),
    label
  );
}

async function tapTargetSlots(page: Page, snapshot: JsonRecord): Promise<void> {
  for (const boundary of targetBoundaries) {
    await tapElement(page, snapshot, `playableSlot:${boundary}`);
    await page.waitForTimeout(80);
  }
}

async function tapElement(page: Page, snapshot: JsonRecord, id: string): Promise<void> {
  const point = interactionPoint(snapshot, id) ?? centerOfRect(rectOf(snapshot, id));
  if (!point) {
    throw new Error(`Missing interaction point for ${id}.`);
  }

  await page.touchscreen.tap(point.x, point.y);
}

async function waitForQaSnapshot(
  page: Page,
  predicate: (snapshot: JsonRecord) => boolean,
  label: string,
  timeoutMs = 8_000
): Promise<JsonRecord> {
  const started = Date.now();
  let lastSnapshot: JsonRecord | null = null;
  while (Date.now() - started < timeoutMs) {
    const snapshot = await readQaSnapshot(page);
    if (snapshot) {
      lastSnapshot = snapshot;
      if (predicate(snapshot)) {
        return snapshot;
      }
    }
    await page.waitForTimeout(50);
  }

  throw new Error(`Timed out waiting for ${label} QA snapshot. Last snapshot: ${JSON.stringify(snapshotSummary(lastSnapshot))}`);
}

async function readQaSnapshot(page: Page): Promise<JsonRecord | null> {
  return page.evaluate((id) => {
    const text = document.getElementById(id)?.textContent;
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, QA_SNAPSHOT_ID);
}

async function readCanvasCapture(page: Page): Promise<JsonRecord | null> {
  return page.evaluate((id) => {
    const text = document.getElementById(id)?.textContent;
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, QA_CANVAS_CHUNKS_ID);
}

async function screenshot(page: Page, path: string): Promise<number> {
  const bytes = await page.screenshot({ path, type: "png" });
  return bytes.length;
}

async function screenshotWithQaSidecar(page: Page, imagePath: string, snapshot?: JsonRecord): Promise<number> {
  const imageBytes = await screenshot(page, imagePath);
  const sidecar = snapshot ?? await waitForQaSnapshot(page, () => true, `${imagePath} QA sidecar`, 1_000);
  writeJson(qaSidecarPath(imagePath), sidecar);
  return imageBytes;
}

function qaSidecarPath(imagePath: string): string {
  return imagePath.replace(/\.(png|jpe?g)$/i, ".json");
}

function activeRuntimeState(snapshot: JsonRecord): JsonRecord {
  const state = stateOf(snapshot);
  return {
    scene: stringAt(snapshot, ["scene"]),
    mode: state.mode,
    phase: state.phase,
    round: state.round,
    fixtureId: state.fixtureId,
    cutCount: state.cutCount,
    inputModality: state.inputModality,
    inputFeelCutCount: state.inputFeelCutCount,
    resolveReady: Boolean(state.resolveButtonReady || state.resolveButtonActionable),
    allTouchTargetsOk: state.allPlayControlTouchTargetsOk,
    feedbackVisible: state.feedbackVisible,
    viewport: snapshot.viewport,
    state,
    resolveButton: rectOf(snapshot, "resolveButton"),
    touchAimLoupe: touchAimLoupeRuntimeState(snapshot),
    activeLabels: elementsOf(snapshot).filter((element) => stringAt(element, ["id"]).startsWith("activeCutLabel:"))
  };
}

function touchAimLoupeRuntimeState(snapshot: JsonRecord): JsonRecord {
  const state = stateOf(snapshot);
  return {
    visible: state.touchAimLoupeVisible === true,
    boundary: state.touchAimLoupeBoundary ?? null,
    snapReady: state.touchAimLoupeSnapReady === true,
    pointerClearancePx: state.touchAimLoupePointerClearancePx ?? null,
    occlusionSafe: state.touchAimLoupeOcclusionSafe === true,
    placement: state.touchAimLoupePlacement ?? "hidden",
    text: elementText(snapshot, "touchAimLoupe"),
    rect: rectOf(snapshot, "touchAimLoupe"),
    armedPreviewBoundary: state.armedPreviewBoundary ?? null,
    armedPreviewReady: state.armedPreviewReady === true,
    armedPreviewStrength: state.armedPreviewStrength ?? null,
    armedPreviewRect: rectOf(snapshot, "armedCutPreview")
  };
}

function reviewRuntimeState(snapshot: JsonRecord): JsonRecord {
  const state = stateOf(snapshot);
  return {
    scene: stringAt(snapshot, ["scene"]),
    mode: state.mode,
    phase: state.phase,
    round: state.round,
    fixtureId: state.fixtureId,
    cutCount: state.cutCount,
    feedbackVisible: state.feedbackVisible,
    feedbackText: elementText(snapshot, "feedbackCard"),
    feedbackCard: feedbackCardState(snapshot),
    feedbackTokenSplit: rectOf(snapshot, "feedbackTokenSplit"),
    petSpeech: rectOf(snapshot, "petSpeechBubble"),
    petSpeechText: elementText(snapshot, "petSpeechBubble"),
    allTouchTargetsOk: state.allPlayControlTouchTargetsOk,
    state
  };
}

function feedbackCardState(snapshot: JsonRecord): JsonRecord {
  const rect = rectOf(snapshot, "feedbackCard") ?? {};
  return {
    compact: booleanAt(snapshot, ["compact"]),
    ...rect
  };
}

function targetSlotRects(snapshot: JsonRecord): JsonRecord[] {
  return targetBoundaries.map((boundary) => {
    const rect = rectOf(snapshot, `playableSlot:${boundary}`);
    if (!rect) {
      throw new Error(`Missing playableSlot:${boundary} in QA snapshot.`);
    }
    return rect;
  });
}

function targetSlotCenters(snapshot: JsonRecord): JsonRecord[] {
  return targetBoundaries.map((boundary) => {
    const rect = rectOf(snapshot, `playableSlot:${boundary}`);
    if (!rect) {
      throw new Error(`Missing playableSlot:${boundary} in QA snapshot.`);
    }
    return { boundary, x: rect.x, y: rect.y };
  });
}

function summaryFromSnapshot(
  name: string,
  url: string,
  snapshot: JsonRecord,
  canvasCapture: JsonRecord | null,
  imageBytes: number
): JsonRecord {
  const elements = elementsOf(snapshot);
  return {
    name,
    url,
    scene: snapshot.scene,
    compact: snapshot.compact,
    viewport: snapshot.viewport,
    motionCurrentY: stateOf(snapshot).motionCurrentY ?? null,
    capture: {
      chunkCount: numberAt(canvasCapture, ["chunkCount"]),
      dataUrlLength: numberAt(canvasCapture, ["dataUrlLength"]),
      canvas: at(canvasCapture, ["canvas"]),
      hash: stringAt(canvasCapture, ["dataUrlHash"]),
      wrotePng: true,
      pngSource: "playwright.screenshot",
      pngBytes: imageBytes
    },
    elements: Object.fromEntries(elements.map((element) => [stringAt(element, ["id"]), element])),
    state: stateOf(snapshot)
  };
}

function prepareDirectory(directory: string): string {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  return directory;
}

async function startServerIfNeeded(options: CaptureOptions): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  if (options.baseUrl) {
    return { baseUrl: options.baseUrl, close: async () => undefined };
  }

  const server: ViteDevServer = await createServer({
    server: {
      host: "127.0.0.1",
      port: options.port,
      strictPort: true
    }
  });
  await server.listen();

  return {
    baseUrl: `http://127.0.0.1:${options.port}/`,
    close: async () => {
      await server.close();
    }
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function urlWithParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function stateOf(snapshot: JsonRecord): JsonRecord {
  return isRecord(snapshot.state) ? snapshot.state : {};
}

function elementsOf(snapshot: JsonRecord): JsonRecord[] {
  return Array.isArray(snapshot.elements) ? snapshot.elements.filter(isRecord) : [];
}

function elementOf(snapshot: JsonRecord, id: string): JsonRecord | undefined {
  return elementsOf(snapshot).find((element) => stringAt(element, ["id"]) === id);
}

function rectOf(snapshot: JsonRecord, id: string): { x: number; y: number; width: number; height: number } | undefined {
  const rect = at(elementOf(snapshot, id), ["rect"]);
  if (!isRecord(rect)) {
    return undefined;
  }

  const x = numberAt(rect, ["x"]);
  const y = numberAt(rect, ["y"]);
  const width = numberAt(rect, ["width"]);
  const height = numberAt(rect, ["height"]);
  if (![x, y, width, height].every(Number.isFinite)) {
    return undefined;
  }
  return { x, y, width, height };
}

function centerOfRect(rect: { x: number; y: number } | undefined): { x: number; y: number } | undefined {
  return rect ? { x: rect.x, y: rect.y } : undefined;
}

function interactionPoint(snapshot: JsonRecord, id: string): { x: number; y: number } | undefined {
  const points = at(snapshot, ["interaction", "points"]);
  if (!Array.isArray(points)) {
    return undefined;
  }
  const point = points.filter(isRecord).find((candidate) => stringAt(candidate, ["id"]) === id);
  if (!point) {
    return undefined;
  }
  const x = numberAt(point, ["client", "x"]);
  const y = numberAt(point, ["client", "y"]);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}

function elementText(snapshot: JsonRecord, id: string): string {
  return stringAt(elementOf(snapshot, id), ["text"]);
}

function stateString(snapshot: JsonRecord, key: string): string {
  return stringAt(stateOf(snapshot), [key]);
}

function stateNumber(snapshot: JsonRecord, key: string): number {
  return numberAt(stateOf(snapshot), [key]);
}

function stateBoolean(snapshot: JsonRecord, key: string): boolean | undefined {
  const value = at(stateOf(snapshot), [key]);
  return typeof value === "boolean" ? value : undefined;
}

function snapshotSummary(snapshot: JsonRecord | null): JsonRecord | null {
  if (!snapshot) {
    return null;
  }
  const state = stateOf(snapshot);
  return {
    scene: snapshot.scene,
    compact: snapshot.compact,
    mode: state.mode,
    phase: state.phase,
    round: state.round,
    cutCount: state.cutCount
  };
}

function valueForFlag(args: string[], flag: string): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === flag) {
      return args[index + 1];
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }
  return undefined;
}

function numberForFlag(args: string[], flag: string): number | undefined {
  const value = valueForFlag(args, flag);
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  return Number.parseInt(value, 10);
}

function at(value: unknown, path: string[]): unknown {
  let current = value;
  for (const part of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function stringAt(value: unknown, path: string[]): string {
  const target = at(value, path);
  return typeof target === "string" ? target : "";
}

function numberAt(value: unknown, path: string[]): number {
  const target = at(value, path);
  return typeof target === "number" && Number.isFinite(target) ? target : Number.NaN;
}

function booleanAt(value: unknown, path: string[]): boolean | undefined {
  const target = at(value, path);
  return typeof target === "boolean" ? target : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function captureFailureMessage(error: unknown): string {
  const message = errorMessage(error);
  if (message.includes("MachPortRendezvousServer") || message.includes("Target page, context or browser has been closed")) {
    return [
      "Browser subprocess capture failed in this environment.",
      "In the managed Codex shell, use the Codex in-app browser with the QA routes in docs/mobile_shell.md, then run npm run mobile:crossref and npm run mobile:freshness.",
      "Original error:",
      message
    ].join("\n");
  }

  return message;
}

async function main(): Promise<void> {
  const options = parseMobileCrossReferenceCaptureArgs(process.argv.slice(2));
  const browserPath = resolve(".ms-playwright");
  if (existsSync(browserPath) && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = browserPath;
  }

  await captureMobileCrossReferenceArtifacts(options);
  const evaluation = evaluateMobileCrossReference({
    menuDirectory: join(options.outRoot, "iab-surface-compare/latest"),
    surfaceDirectory: join(options.outRoot, "mobile-port-audit/latest"),
    runtimeDirectory: join(options.outRoot, "mobile-runtime/latest")
  });
  console.log(renderMobileCrossReferenceEvaluation(evaluation));
  process.exitCode = evaluation.ready ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
