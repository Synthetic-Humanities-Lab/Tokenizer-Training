import { describe, expect, it, vi } from "vitest";
import {
  copyTextToClipboard,
  type ClipboardEnvironment,
  type LegacyTextArea
} from "../src/game/systems/ClipboardSystem";

class FakeTextArea implements LegacyTextArea {
  value = "";
  style = {};
  readonly attributes = new Map<string, string>();
  readonly select = vi.fn();
  readonly setSelectionRange = vi.fn();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

function legacyEnvironment(execResult: boolean): ClipboardEnvironment & { area: FakeTextArea; appended: FakeTextArea[] } {
  const area = new FakeTextArea();
  const appended: FakeTextArea[] = [];

  return {
    area,
    appended,
    document: {
      body: {
        appendChild(element) {
          appended.push(element as FakeTextArea);
        },
        removeChild(element) {
          const index = appended.indexOf(element as FakeTextArea);
          if (index >= 0) {
            appended.splice(index, 1);
          }
        }
      },
      createElement() {
        return area;
      },
      execCommand(command) {
        return command === "copy" && execResult;
      }
    }
  };
}

describe("copyTextToClipboard", () => {
  it("uses the async clipboard API when available", async () => {
    const writeText = vi.fn<Clipboard["writeText"]>().mockResolvedValue(undefined);

    const result = await copyTextToClipboard("summary", {
      navigator: {
        clipboard: { writeText }
      }
    });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("summary");
  });

  it("falls back to a temporary textarea when async clipboard write fails", async () => {
    const environment = legacyEnvironment(true);
    const writeText = vi.fn<Clipboard["writeText"]>().mockRejectedValue(new Error("denied"));

    const result = await copyTextToClipboard("fallback summary", {
      ...environment,
      navigator: {
        clipboard: { writeText }
      }
    });

    expect(result).toBe("copied");
    expect(environment.area.value).toBe("fallback summary");
    expect(environment.area.attributes.get("readonly")).toBe("");
    expect(environment.area.select).toHaveBeenCalled();
    expect(environment.area.setSelectionRange).toHaveBeenCalledWith(0, "fallback summary".length);
    expect(environment.appended).toEqual([]);
  });

  it("returns unavailable and still removes the temporary textarea when legacy copy fails", async () => {
    const environment = legacyEnvironment(false);

    const result = await copyTextToClipboard("uncopied summary", environment);

    expect(result).toBe("unavailable");
    expect(environment.appended).toEqual([]);
  });

  it("returns unavailable when no browser copy path exists", async () => {
    await expect(copyTextToClipboard("summary", {})).resolves.toBe("unavailable");
  });
});
