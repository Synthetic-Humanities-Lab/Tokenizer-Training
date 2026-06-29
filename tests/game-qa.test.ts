import { describe, expect, it } from "vitest";
import {
  GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE,
  GAME_QA_CANVAS_CAPTURE_CHUNKS_ID,
  GAME_QA_CANVAS_CAPTURE_ID,
  LEGACY_GAME_QA_SNAPSHOT_ID,
  clearGameQaSnapshot,
  gameQaCanvasCaptureChunkId,
  GAME_QA_SNAPSHOT_ID,
  snapshotWithInteractionProjection,
  writeGameQaCanvasCapture,
  writeGameQaImageCapture,
  writeGameQaSnapshot,
  type GameQaSnapshot
} from "../src/game/systems/GameQaSystem";

class FakeScriptElement {
  id = "";
  type = "";
  private text = "";
  onRemove?: () => void;
  onTextContentWrite?: (node: FakeScriptElement) => void;
  private readonly attributes = new Map<string, string>();

  get textContent(): string {
    return this.text;
  }

  set textContent(value: string) {
    this.text = value;
    this.onTextContentWrite?.(this);
  }

  remove(): void {
    this.onRemove?.();
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
}

function fakeDocument() {
  const nodes = new Map<string, FakeScriptElement>();
  const textContentWrites: string[] = [];
  let canvas: Partial<HTMLCanvasElement> | null = null;
  return {
    documentRef: {
      body: {
        appendChild: (node: FakeScriptElement) => {
          node.onRemove = () => nodes.delete(node.id);
          nodes.set(node.id, node);
          return node;
        }
      },
      createElement: () => {
        const node = new FakeScriptElement();
        node.onTextContentWrite = (updated) => textContentWrites.push(updated.id);
        return node;
      },
      getElementById: (id: string) => nodes.get(id) ?? null,
      querySelector: (selector: string) => selector === "canvas" ? canvas : null
    } as unknown as Document,
    setCanvas: (nextCanvas: Partial<HTMLCanvasElement> | null) => {
      canvas = nextCanvas;
    },
    nodes,
    textContentWrites
  };
}

function fakeDomRect(input: { x: number; y: number; width: number; height: number }): DOMRect {
  return {
    ...input,
    left: input.x,
    top: input.y,
    right: input.x + input.width,
    bottom: input.y + input.height,
    toJSON: () => input
  } as DOMRect;
}

const snapshot: GameQaSnapshot = {
  scene: "TutorialCompleteScene",
  compact: true,
  viewport: { width: 390, height: 844 },
  elements: [
    { id: "panel", rect: { x: 195, y: 422, width: 358, height: 420 } },
    { id: "primaryButton", text: "Start Endless Training", rect: { x: 195, y: 516, width: 310, height: 46 } }
  ]
};

describe("writeGameQaSnapshot", () => {
  it("writes a hidden JSON snapshot for browser QA when enabled", () => {
    const { documentRef, nodes } = fakeDocument();

    writeGameQaSnapshot(snapshot, { documentRef, enabled: true });

    const node = nodes.get(GAME_QA_SNAPSHOT_ID);
    expect(node?.type).toBe("application/json");
    expect(JSON.parse(node?.textContent ?? "")).toEqual(snapshot);
  });

  it("projects QA geometry into browser client coordinates when the canvas is offset", () => {
    const { documentRef, nodes, setCanvas } = fakeDocument();
    const projectedSnapshot: GameQaSnapshot = {
      scene: "PlayScene",
      viewport: { width: 390, height: 844 },
      elements: [
        {
          id: "playableSlot:3",
          rect: { x: 100, y: 449, width: 52, height: 76 },
          visible: false,
          text: "3"
        },
        {
          id: "resolveButton",
          rect: { x: 306, y: 810, width: 136, height: 44 },
          text: "Resolve"
        }
      ]
    };
    setCanvas({
      width: 390,
      height: 844,
      getBoundingClientRect: () => fakeDomRect({
        x: 445,
        y: -62,
        width: 390,
        height: 844
      })
    });

    writeGameQaSnapshot(projectedSnapshot, { documentRef, enabled: true, captureCanvas: false });

    const written = JSON.parse(nodes.get(GAME_QA_SNAPSHOT_ID)?.textContent ?? "") as GameQaSnapshot;
    expect(written.interaction).toEqual({
      canvasRect: { x: 445, y: -62, width: 390, height: 844 },
      scaleX: 1,
      scaleY: 1,
      points: [
        {
          id: "playableSlot:3",
          game: { x: 100, y: 449 },
          client: { x: 545, y: 387 },
          visible: false,
          text: "3"
        },
        {
          id: "resolveButton",
          game: { x: 306, y: 810 },
          client: { x: 751, y: 748 },
          text: "Resolve"
        }
      ]
    });
  });

  it("scales projected interaction points when the browser canvas is resized", () => {
    const { documentRef, setCanvas } = fakeDocument();
    setCanvas({
      width: 390,
      height: 844,
      getBoundingClientRect: () => fakeDomRect({
        x: 20,
        y: 40,
        width: 780,
        height: 422
      })
    });

    const projected = snapshotWithInteractionProjection(snapshot, documentRef);

    expect(projected.interaction?.scaleX).toBe(2);
    expect(projected.interaction?.scaleY).toBe(0.5);
    expect(projected.interaction?.points.find((point) => point.id === "primaryButton")).toMatchObject({
      id: "primaryButton",
      game: { x: 195, y: 516 },
      client: { x: 410, y: 298 },
      text: "Start Endless Training"
    });
  });

  it("reuses the existing snapshot node", () => {
    const { documentRef, nodes } = fakeDocument();
    const updated = { ...snapshot, scene: "MenuScene" };

    writeGameQaSnapshot(snapshot, { documentRef, enabled: true });
    writeGameQaSnapshot(updated, { documentRef, enabled: true });

    expect(nodes.size).toBe(2);
    expect(JSON.parse(nodes.get(GAME_QA_SNAPSHOT_ID)?.textContent ?? "")).toEqual(updated);
    expect(JSON.parse(nodes.get(LEGACY_GAME_QA_SNAPSHOT_ID)?.textContent ?? "")).toEqual(updated);
  });

  it("does not write QA evidence when disabled", () => {
    const { documentRef, nodes } = fakeDocument();

    writeGameQaSnapshot(snapshot, { documentRef, enabled: false });

    expect(nodes.size).toBe(0);
  });

  it("clears stale QA evidence when enabled", () => {
    const { documentRef, nodes } = fakeDocument();

    writeGameQaSnapshot(snapshot, { documentRef, enabled: true });
    clearGameQaSnapshot({ documentRef, enabled: true });

    expect(nodes.size).toBe(0);
  });

  it("keeps QA evidence when clearing is disabled", () => {
    const { documentRef, nodes } = fakeDocument();

    writeGameQaSnapshot(snapshot, { documentRef, enabled: true });
    clearGameQaSnapshot({ documentRef, enabled: false });

    expect(nodes.size).toBe(2);
  });

  it("writes a dev-only canvas capture when a readable canvas is available", () => {
    const { documentRef, nodes, setCanvas } = fakeDocument();
    setCanvas({
      width: 390,
      height: 844,
      toDataURL: () => "data:image/png;base64,abc123"
    });

    writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });

    const node = nodes.get(GAME_QA_CANVAS_CAPTURE_ID);
    const manifest = nodes.get(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID);
    expect(node?.type).toBe("application/json");
    expect(JSON.parse(node?.textContent ?? "")).toEqual({
      scene: "TutorialCompleteScene",
      compact: true,
      viewport: { width: 390, height: 844 },
      canvas: {
        width: 390,
        height: 844,
        dataUrl: "data:image/png;base64,abc123"
      }
    });
    expect(manifest?.type).toBe("application/json");
    expect(JSON.parse(manifest?.textContent ?? "")).toEqual({
      scene: "TutorialCompleteScene",
      compact: true,
      viewport: { width: 390, height: 844 },
      captureId: expect.any(String),
      canvas: { width: 390, height: 844 },
      chunkSize: GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE,
      chunkCount: 1,
      dataUrlLength: "data:image/png;base64,abc123".length,
      dataUrlHash: expect.any(String)
    });
    expect(JSON.parse(manifest?.textContent ?? "").dataUrlHash).toMatch(/^[0-9a-f]{8}$/);
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.textContent).toBe("data:image/png;base64,abc123");
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.getAttribute("data-capture-id")).toBe(
      JSON.parse(manifest?.textContent ?? "").captureId
    );
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.getAttribute("data-data-url-hash")).toBe(
      JSON.parse(manifest?.textContent ?? "").dataUrlHash
    );
  });

  it("writes chunked canvas data so large QA rasters can be reconstructed without one huge DOM read", () => {
    const { documentRef, nodes, setCanvas, textContentWrites } = fakeDocument();
    const dataUrl = `data:image/png;base64,${"a".repeat(GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE + 17)}`;
    setCanvas({
      width: 1280,
      height: 720,
      toDataURL: () => dataUrl
    });

    writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });

    const manifest = JSON.parse(nodes.get(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID)?.textContent ?? "");
    expect(manifest).toMatchObject({
      scene: "TutorialCompleteScene",
      canvas: { width: 1280, height: 720 },
      captureId: expect.any(String),
      chunkSize: GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE,
      chunkCount: 2,
      dataUrlLength: dataUrl.length,
      dataUrlHash: expect.stringMatching(/^[0-9a-f]{8}$/)
    });
    const reconstructed = [
      nodes.get(gameQaCanvasCaptureChunkId(0))?.textContent,
      nodes.get(gameQaCanvasCaptureChunkId(1))?.textContent
    ].join("");
    expect(reconstructed).toBe(dataUrl);
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.getAttribute("data-capture-id")).toBe(manifest.captureId);
    expect(nodes.get(gameQaCanvasCaptureChunkId(1))?.getAttribute("data-capture-id")).toBe(manifest.captureId);
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.getAttribute("data-data-url-hash")).toBe(manifest.dataUrlHash);
    expect(nodes.get(gameQaCanvasCaptureChunkId(1))?.getAttribute("data-data-url-hash")).toBe(manifest.dataUrlHash);
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.getAttribute("data-chunk-count")).toBe("2");
    expect(textContentWrites.lastIndexOf(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID)).toBeGreaterThan(
      textContentWrites.lastIndexOf(gameQaCanvasCaptureChunkId(1))
    );
  });

  it("writes renderer image captures through the same browser-readable QA evidence nodes", () => {
    const { documentRef, nodes } = fakeDocument();
    const dataUrl = "data:image/png;base64,renderer123";

    writeGameQaImageCapture(snapshot, { width: 1280, height: 720, dataUrl }, { documentRef, enabled: true });

    expect(JSON.parse(nodes.get(GAME_QA_CANVAS_CAPTURE_ID)?.textContent ?? "")).toEqual({
      scene: "TutorialCompleteScene",
      compact: true,
      viewport: { width: 390, height: 844 },
      canvas: {
        width: 1280,
        height: 720,
        dataUrl
      }
    });
    expect(JSON.parse(nodes.get(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID)?.textContent ?? "")).toMatchObject({
      scene: "TutorialCompleteScene",
      canvas: { width: 1280, height: 720 },
      chunkCount: 1,
      dataUrlLength: dataUrl.length
    });
    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.textContent).toBe(dataUrl);
  });

  it("removes stale chunk nodes when a later canvas capture is shorter", () => {
    const { documentRef, nodes, setCanvas } = fakeDocument();
    setCanvas({
      width: 1280,
      height: 720,
      toDataURL: () => `data:image/png;base64,${"a".repeat(GAME_QA_CANVAS_CAPTURE_CHUNK_SIZE + 17)}`
    });
    writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });
    expect(nodes.has(gameQaCanvasCaptureChunkId(1))).toBe(true);

    setCanvas({
      width: 390,
      height: 844,
      toDataURL: () => "data:image/png;base64,small"
    });
    writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });

    expect(nodes.get(gameQaCanvasCaptureChunkId(0))?.textContent).toBe("data:image/png;base64,small");
    expect(nodes.has(gameQaCanvasCaptureChunkId(1))).toBe(false);
    expect(JSON.parse(nodes.get(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID)?.textContent ?? "").chunkCount).toBe(1);
  });

  it("clears stale canvas capture evidence with the QA snapshot", () => {
    const { documentRef, nodes, setCanvas } = fakeDocument();
    setCanvas({
      width: 390,
      height: 844,
      toDataURL: () => "data:image/png;base64,abc123"
    });

    writeGameQaSnapshot(snapshot, { documentRef, enabled: true, captureCanvas: false });
    writeGameQaCanvasCapture(snapshot, { documentRef, enabled: true });
    clearGameQaSnapshot({ documentRef, enabled: true });

    expect(nodes.has(GAME_QA_SNAPSHOT_ID)).toBe(false);
    expect(nodes.has(GAME_QA_CANVAS_CAPTURE_ID)).toBe(false);
    expect(nodes.has(GAME_QA_CANVAS_CAPTURE_CHUNKS_ID)).toBe(false);
    expect(nodes.has(gameQaCanvasCaptureChunkId(0))).toBe(false);
  });
});
