import { describe, expect, it } from "vitest";
import { parseQaViewport, qaViewportFromUrl } from "../src/game/systems/QaViewportSystem";

describe("QA viewport parsing", () => {
  it("parses explicit width-by-height QA viewports", () => {
    expect(parseQaViewport("320x568")).toEqual({ width: 320, height: 568 });
    expect(parseQaViewport("768 x 1024")).toEqual({ width: 768, height: 1024 });
  });

  it("rejects missing, malformed, or unsafe viewport sizes", () => {
    expect(parseQaViewport(undefined)).toBeUndefined();
    expect(parseQaViewport("phone")).toBeUndefined();
    expect(parseQaViewport("100x100")).toBeUndefined();
    expect(parseQaViewport("4096x4096")).toBeUndefined();
  });

  it("reads QA viewport parameters from query or hash URLs", () => {
    expect(qaViewportFromUrl("http://127.0.0.1:5173/?mode=tutorial&qaViewport=390x844")).toEqual({
      width: 390,
      height: 844
    });
    expect(qaViewportFromUrl("http://127.0.0.1:5173/#qaViewport=320x568")).toEqual({
      width: 320,
      height: 568
    });
    expect(qaViewportFromUrl("not a url")).toBeUndefined();
  });
});
