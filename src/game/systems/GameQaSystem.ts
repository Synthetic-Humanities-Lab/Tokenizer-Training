import {
  LEGACY_QA_CANVAS_CAPTURE_ID,
  LEGACY_QA_SNAPSHOT_ID,
  PREVIOUS_QA_CANVAS_CAPTURE_ID,
  PREVIOUS_QA_SNAPSHOT_ID,
  QA_CANVAS_CAPTURE_IDS,
  QA_CANVAS_CAPTURE_ID,
  QA_SNAPSHOT_ID,
  QA_SNAPSHOT_IDS
} from "./ProductIdentitySystem";

export const GAME_QA_SNAPSHOT_ID = QA_SNAPSHOT_ID;
export const PREVIOUS_GAME_QA_SNAPSHOT_ID = PREVIOUS_QA_SNAPSHOT_ID;
export const LEGACY_GAME_QA_SNAPSHOT_ID = LEGACY_QA_SNAPSHOT_ID;
export const GAME_QA_CANVAS_CAPTURE_ID = QA_CANVAS_CAPTURE_ID;
export const PREVIOUS_GAME_QA_CANVAS_CAPTURE_ID = PREVIOUS_QA_CANVAS_CAPTURE_ID;
export const LEGACY_GAME_QA_CANVAS_CAPTURE_ID = LEGACY_QA_CANVAS_CAPTURE_ID;
export const GAME_QA_CANVAS_CAPTURE_CHUNKS_ID = `${GAME_QA_CANVAS_CAPTURE_ID}-chunks`;
export const PREVIOUS_GAME_QA_CANVAS_CAPTURE_CHUNKS_ID = `${PREVIOUS_GAME_QA_CANVAS_CAPTURE_ID}-chunks`;
export const LEGACY_GAME_QA_CANVAS_CAPTURE_CHUNKS_ID = `${LEGACY_GAME_QA_CANVAS_CAPTURE_ID}-chunks`;
export const GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE = 60_000;

export function gameQaCanvasCaptureChunkId(index: number): string {
  return `${GAME_QA_CANVAS_CAPTURE_ID}-chunk-${index}`;
}

export function previousGameQaCanvasCaptureChunkId(index: number): string {
  return `${PREVIOUS_GAME_QA_CANVAS_CAPTURE_ID}-chunk-${index}`;
}

export function legacyGameQaCanvasCaptureChunkId(index: number): string {
  return `${LEGACY_GAME_QA_CANVAS_CAPTURE_ID}-chunk-${index}`;
}

const GAME_QA_SNAPSHOT_IDS = [...QA_SNAPSHOT_IDS];
const GAME_QA_CANVAS_CAPTURE_IDS = [...QA_CANVAS_CAPTURE_IDS];
const GAME_QA_CANVAS_CAPTURE_CHUNKS_IDS = [
  GAME_QA_CANVAS_CAPTURE_CHUNKS_ID,
  PREVIOUS_GAME_QA_CANVAS_CAPTURE_CHUNKS_ID,
  LEGACY_GAME_QA_CANVAS_CAPTURE_CHUNKS_ID
];
const GAME_QA_CANVAS_CAPTURE_CHUNK_ID_FACTORIES = [
  gameQaCanvasCaptureChunkId,
  previousGameQaCanvasCaptureChunkId,
  legacyGameQaCanvasCaptureChunkId
];

export interface GameQaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameQaElement {
  id: string;
  rect?: GameQaRect;
  text?: string;
  fontSize?: number;
  wordWrapWidth?: number;
  visible?: boolean;
}

export type GameQaStateValue = string | number | boolean | null;

export interface GameQaInteractionPoint {
  id: string;
  game: {
    x: number;
    y: number;
  };
  client: {
    x: number;
    y: number;
  };
  visible?: boolean;
  text?: string;
}

export interface GameQaInteractionProjection {
  canvasRect: GameQaRect;
  scaleX: number;
  scaleY: number;
  points: GameQaInteractionPoint[];
}

export interface GameQaSnapshot {
  scene: string;
  compact?: boolean;
  viewport: {
    width: number;
    height: number;
  };
  state?: Record<string, GameQaStateValue>;
  elements: GameQaElement[];
  interaction?: GameQaInteractionProjection;
}

export interface GameQaCanvasCapture {
  scene: string;
  compact?: boolean;
  viewport: GameQaSnapshot["viewport"];
  canvas: {
    width: number;
    height: number;
    dataUrl: string;
  };
}

export interface GameQaCanvasCaptureChunks {
  scene: string;
  compact?: boolean;
  viewport: GameQaSnapshot["viewport"];
  captureId: string;
  canvas: {
    width: number;
    height: number;
  };
  chunkSize: number;
  chunkCount: number;
  dataUrlLength: number;
  dataUrlHash: string;
}

export function writeGameQaSnapshot(
  snapshot: GameQaSnapshot,
  options: { documentRef?: Document; enabled?: boolean; captureCanvas?: boolean; deferCanvasCapture?: boolean } = {}
): void {
  const enabled = options.enabled ?? import.meta.env.DEV;
  const documentRef = options.documentRef ?? globalThis.document;
  if (!enabled || !documentRef?.body) {
    return;
  }

  const projectedSnapshot = snapshotWithInteractionProjection(snapshot, documentRef);

  for (const id of GAME_QA_SNAPSHOT_IDS) {
    qaScriptNode(documentRef, id, "application/json").textContent = JSON.stringify(projectedSnapshot);
  }

  if (options.captureCanvas ?? enabled) {
    if (options.deferCanvasCapture === false) {
      writeGameQaCanvasCapture(projectedSnapshot, { documentRef, enabled: true });
    } else if (documentRef.hidden) {
      globalThis.setTimeout(() => {
        if (gameQaSnapshotIsCurrent(projectedSnapshot, documentRef)) {
          writeGameQaCanvasCapture(projectedSnapshot, { documentRef, enabled: true });
        }
      }, 0);
    } else {
      deferGameQaCanvasCapture(projectedSnapshot, { documentRef, enabled: true });
    }
  }
}

export function snapshotWithInteractionProjection(
  snapshot: GameQaSnapshot,
  documentRef: Document = globalThis.document
): GameQaSnapshot {
  if (!documentRef || typeof documentRef.querySelector !== "function") {
    return snapshot;
  }

  const canvas = documentRef.querySelector("canvas") as HTMLCanvasElement | null;
  const canvasRect = readableCanvasRect(canvas);
  if (!canvasRect || snapshot.viewport.width <= 0 || snapshot.viewport.height <= 0) {
    return snapshot;
  }

  const scaleX = canvasRect.width / snapshot.viewport.width;
  const scaleY = canvasRect.height / snapshot.viewport.height;
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
    return snapshot;
  }

  return {
    ...snapshot,
    interaction: {
      canvasRect,
      scaleX,
      scaleY,
      points: snapshot.elements
        .filter((element): element is GameQaElement & { rect: GameQaRect } => element.rect !== undefined)
        .map((element) => ({
          id: element.id,
          game: {
            x: element.rect.x,
            y: element.rect.y
          },
          client: {
            x: canvasRect.x + element.rect.x * scaleX,
            y: canvasRect.y + element.rect.y * scaleY
          },
          visible: element.visible,
          text: element.text
        }))
    }
  };
}

export function clearGameQaSnapshot(options: { documentRef?: Document; enabled?: boolean } = {}): void {
  const enabled = options.enabled ?? import.meta.env.DEV;
  const documentRef = options.documentRef ?? globalThis.document;
  if (!enabled) {
    return;
  }

  GAME_QA_SNAPSHOT_IDS.forEach((id) => documentRef?.getElementById(id)?.remove());
  clearGameQaCanvasCapture(documentRef);
}

export function deferGameQaCanvasCapture(
  snapshot: GameQaSnapshot,
  options: { documentRef?: Document; enabled?: boolean } = {}
): void {
  const enabled = options.enabled ?? import.meta.env.DEV;
  const documentRef = options.documentRef ?? globalThis.document;
  if (!enabled || typeof documentRef?.querySelector !== "function") {
    return;
  }

  const capture = () => {
    if (gameQaSnapshotIsCurrent(snapshot, documentRef)) {
      writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });
    }
  };
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(capture));
    return;
  }

  globalThis.setTimeout(capture, 0);
}

function gameQaSnapshotIsCurrent(snapshot: GameQaSnapshot, documentRef: Document): boolean {
  return documentRef.getElementById(GAME_QA_SNAPSHOT_ID)?.textContent === JSON.stringify(snapshot);
}

export function writeGameQaCanvasCapture(
  snapshot: GameQaSnapshot,
  options: { documentRef?: Document; enabled?: boolean } = {}
): void {
  const enabled = options.enabled ?? import.meta.env.DEV;
  const documentRef = options.documentRef ?? globalThis.document;
  if (!enabled || !documentRef?.body || typeof documentRef.querySelector !== "function") {
    return;
  }

  const canvas = documentRef.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas || typeof canvas.toDataURL !== "function") {
    clearGameQaCanvasCapture(documentRef);
    return;
  }

  let dataUrl = "";
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch {
    clearGameQaCanvasCapture(documentRef);
    return;
  }

  writeGameQaCanvasCaptureRecord(
    {
      scene: snapshot.scene,
      compact: snapshot.compact,
      viewport: snapshot.viewport,
      canvas: {
        width: canvas.width,
        height: canvas.height,
        dataUrl
      }
    },
    snapshot,
    documentRef
  );
}

export function writeGameQaImageCapture(
  snapshot: GameQaSnapshot,
  captureInput: { width: number; height: number; dataUrl: string },
  options: { documentRef?: Document; enabled?: boolean } = {}
): void {
  const enabled = options.enabled ?? import.meta.env.DEV;
  const documentRef = options.documentRef ?? globalThis.document;
  if (!enabled || !documentRef?.body || !captureInput.dataUrl.startsWith("data:image/")) {
    return;
  }

  writeGameQaCanvasCaptureRecord(
    {
      scene: snapshot.scene,
      compact: snapshot.compact,
      viewport: snapshot.viewport,
      canvas: {
        width: captureInput.width,
        height: captureInput.height,
        dataUrl: captureInput.dataUrl
      }
    },
    snapshot,
    documentRef
  );
}

function writeGameQaCanvasCaptureRecord(
  capture: GameQaCanvasCapture,
  snapshot: GameQaSnapshot,
  documentRef: Document
): void {
  for (const id of GAME_QA_CANVAS_CAPTURE_IDS) {
    qaScriptNode(documentRef, id, "application/json").textContent = JSON.stringify(capture);
  }
  writeGameQaCanvasCaptureChunks(snapshot, capture, documentRef);
}

function qaScriptNode(documentRef: Document, id: string, type: string): HTMLScriptElement {
  let node = documentRef.getElementById(id) as HTMLScriptElement | null;
  if (!node) {
    node = documentRef.createElement("script");
    node.id = id;
    node.type = type;
    documentRef.body.appendChild(node);
  }

  return node;
}

function readableCanvasRect(canvas: HTMLCanvasElement | null): GameQaRect | undefined {
  if (!canvas || typeof canvas.getBoundingClientRect !== "function") {
    return undefined;
  }

  const rect = canvas.getBoundingClientRect();
  const x = Number(rect.x);
  const y = Number(rect.y);
  const width = Number(rect.width);
  const height = Number(rect.height);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return undefined;
  }

  return { x, y, width, height };
}

function writeGameQaCanvasCaptureChunks(
  snapshot: GameQaSnapshot,
  capture: GameQaCanvasCapture,
  documentRef: Document
): void {
  const previousChunkCount = existingChunkCount(documentRef);
  const chunks = chunkString(capture.canvas.dataUrl, GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE);
  const dataUrlHash = hashString(capture.canvas.dataUrl);
  const captureId = captureIdFor(snapshot, capture);
  const manifest: GameQaCanvasCaptureChunks = {
    scene: snapshot.scene,
    compact: snapshot.compact,
    viewport: snapshot.viewport,
    captureId,
    canvas: {
      width: capture.canvas.width,
      height: capture.canvas.height
    },
    chunkSize: GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE,
    chunkCount: chunks.length,
    dataUrlLength: capture.canvas.dataUrl.length,
    dataUrlHash
  };

  for (const chunkIdFor of GAME_QA_CANVAS_CAPTURE_CHUNK_ID_FACTORIES) {
    chunks.forEach((chunk, index) => {
      const chunkNode = qaScriptNode(documentRef, chunkIdFor(index), "text/plain");
      chunkNode.setAttribute("data-capture-id", captureId);
      chunkNode.setAttribute("data-chunk-index", `${index}`);
      chunkNode.setAttribute("data-chunk-count", `${chunks.length}`);
      chunkNode.setAttribute("data-data-url-length", `${capture.canvas.dataUrl.length}`);
      chunkNode.setAttribute("data-data-url-hash", dataUrlHash);
      chunkNode.textContent = chunk;
    });

    for (let index = chunks.length; index < previousChunkCount; index += 1) {
      documentRef.getElementById(chunkIdFor(index))?.remove();
    }
  }

  for (const manifestId of GAME_QA_CANVAS_CAPTURE_CHUNKS_IDS) {
    const manifestNode = qaScriptNode(documentRef, manifestId, "application/json");
    manifestNode.setAttribute("data-capture-id", captureId);
    manifestNode.textContent = JSON.stringify(manifest);
  }
}

function clearGameQaCanvasCapture(documentRef?: Document): void {
  const chunkCount = existingChunkCount(documentRef);
  GAME_QA_CANVAS_CAPTURE_IDS.forEach((id) => documentRef?.getElementById(id)?.remove());
  GAME_QA_CANVAS_CAPTURE_CHUNKS_IDS.forEach((id) => documentRef?.getElementById(id)?.remove());
  for (let index = 0; index < chunkCount; index += 1) {
    GAME_QA_CANVAS_CAPTURE_CHUNK_ID_FACTORIES.forEach((chunkIdFor) => {
      documentRef?.getElementById(chunkIdFor(index))?.remove();
    });
  }
}

function existingChunkCount(documentRef?: Document): number {
  const manifestNode = GAME_QA_CANVAS_CAPTURE_CHUNKS_IDS.map((id) => documentRef?.getElementById(id)).find(
    (node) => node
  );
  if (!manifestNode?.textContent) {
    return 0;
  }

  try {
    const parsed = JSON.parse(manifestNode.textContent) as Partial<GameQaCanvasCaptureChunks>;
    return Number.isInteger(parsed.chunkCount) && parsed.chunkCount !== undefined && parsed.chunkCount > 0
      ? parsed.chunkCount
      : 0;
  } catch {
    return 0;
  }
}

function chunkString(value: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }
  return chunks.length > 0 ? chunks : [""];
}

function captureIdFor(snapshot: GameQaSnapshot, capture: GameQaCanvasCapture): string {
  return [
    snapshot.scene,
    capture.canvas.width,
    capture.canvas.height,
    capture.canvas.dataUrl.length,
    hashString(capture.canvas.dataUrl)
  ].join("-");
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
