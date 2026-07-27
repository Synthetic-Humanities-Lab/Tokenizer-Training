import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("current browser QA and surface contract docs", () => {
  it("documents the current visible PlayScene contract instead of old hidden surfaces", () => {
    const contract = readRepoFile("docs/current_surface_contract.md");
    const visibleSurfaces = sectionBody(contract, "## Current Visible Surfaces");
    const removedSurfaces = sectionBody(contract, "## Removed Surfaces");

    expect(contract).toContain("Current Visible Surfaces");
    expect(contract).toContain("HUD");
    expect(contract).toContain("playfield");
    expect(contract).toContain("one pet Wiener");
    expect(contract).toContain("one pet speech bubble");
    expect(contract).toContain("feedback card");
    expect(contract).toContain("complete resolved token");
    expect(contract).toContain("does not duplicate token IDs");
    expect(contract).toContain("bottom control row");
    expect(contract).toContain("Removed Surfaces");
    expect(contract).toContain("side brand panel");
    expect(contract).toContain("side assistant panel");
    expect(contract).toContain("footer panel");
    expect(contract).toContain("detached tutorial popup");
    expect(contract).toContain("separate token strip");
    expect(contract).toContain("overseer panel");
    expect(contract).toContain("falling submitted piece");
    expect(contract).toContain("invented ID");
    expect(visibleSurfaces).toContain("one pet speech bubble");
    expect(visibleSurfaces).toContain("Feedback card");
    expect(visibleSurfaces).not.toContain("side assistant panel");
    expect(visibleSurfaces).not.toContain("detached tutorial popup");
    expect(visibleSurfaces).not.toContain("separate token strip");
    expect(visibleSurfaces).not.toContain("overseer panel");
    expect(removedSurfaces).toContain("side assistant panel");
    expect(removedSurfaces).toContain("detached tutorial popup");
    expect(removedSurfaces).toContain("separate token strip");
    expect(removedSurfaces).toContain("overseer panel");
  });

  it("keeps current docs aligned with the post-cleanup architecture", () => {
    const audit = readRepoFile("docs/pre_port_audit_2026-06-29.md");
    const target = readRepoFile("docs/repo_target.md");
    const notes = readRepoFile("docs/integration_notes.md");

    expect(audit).toContain("PlayScene no longer constructs hidden side brand, side assistant, footer, overseer, detached tutorial popup, or separate token-strip review surfaces.");
    expect(audit).toContain("Review token evidence now belongs to the feedback card");
    expect(audit).toContain("WienerSpeechSystem");
    expect(target).toContain("WienerSpeechSystem.ts");
    expect(target).toContain("FeedbackCard.ts");
    expect(target).not.toContain("OverseerPanel.ts");
    expect(notes).toContain("Wiener Speech Line Schema Notes");
    expect(notes).toContain("single visible pet speech bubble");
  });
});

function sectionBody(markdown: string, section: string): string {
  const start = markdown.indexOf(section);
  if (start < 0) {
    return "";
  }

  const bodyStart = start + section.length;
  const nextSection = markdown.slice(bodyStart).search(/\n## /);
  return nextSection < 0 ? markdown.slice(bodyStart) : markdown.slice(bodyStart, bodyStart + nextSection);
}
