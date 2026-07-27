import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  semanticQaFocusActionId,
  semanticQaVisibleFromSearch
} from "../src/game/semantic/SemanticDomSurface";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("semantic DOM contract", () => {
  it("exposes the semantic surface only for the explicit native QA query", () => {
    expect(semanticQaVisibleFromSearch("?surface=mobile&semanticUi=visible")).toBe(true);
    expect(semanticQaVisibleFromSearch("?surface=mobile&semanticUi=hidden")).toBe(false);
    expect(semanticQaVisibleFromSearch(undefined)).toBe(false);
    expect(semanticQaFocusActionId("menu")).toBe("token-log");
    expect(semanticQaFocusActionId("token-log")).toBe("back");
    expect(semanticQaFocusActionId("settings")).toBe("back");
    expect(semanticQaFocusActionId("results")).toBe("menu");
    expect(semanticQaFocusActionId("tutorial-complete")).toBe("menu");
  });

  it("uses one native DOM surface with delegated native button activation and live regions", () => {
    const source = readRepoFile("src/game/semantic/SemanticDomSurface.ts");

    expect(source.match(/createElement\("section"\)/g)).toHaveLength(1);
    expect(source).toContain('createElement("h1")');
    expect(source).toContain('createElement("h2")');
    expect(source).toContain('createElement("h3")');
    expect(source).toContain("this.heading.tabIndex = -1");
    expect(source).toContain('createElement("p")');
    expect(source).toContain('createElement("ul")');
    expect(source).toContain('createElement("ol")');
    expect(source.match(/createElement\("bdi"\)/g)).toHaveLength(2);
    expect(source.match(/createElement\("code"\)/g)).toHaveLength(2);
    expect(source).toContain('createElement("button")');
    expect(source).toContain('mappingsHeading.textContent = "Token mappings"');
    expect(source).toContain('`${mapping.positionLabel}: token text`');
    expect(source).toContain('`${mapping.valueLabel}:`');
    expect(source).toContain('button.type = "button"');
    expect(source).toContain('setAttribute("role", "region")');
    expect(source).toContain('setAttribute("aria-labelledby", this.heading.id)');
    expect(source).toContain('politeness === "assertive" ? "alert" : "status"');
    expect(source).toContain('setAttribute("aria-live", politeness)');
    expect(source).toContain('setAttribute("aria-atomic", "true")');
    expect(source).toContain('this.root.addEventListener("click", this.handleClick)');
    expect(source).toContain('this.root.addEventListener("change", this.handleChange)');
    expect(source).toContain('ownerDocument.addEventListener("keydown", this.handleKeyDown, true)');
    expect(source).toContain('input.setAttribute("role", "switch")');
    expect(source).toContain('panel.setAttribute("role", "alertdialog")');
    expect(source).toContain("if (dialog.modal)");
    expect(source).toContain('panel.setAttribute("aria-modal", "true")');
    expect(source).toContain('panel.setAttribute("aria-labelledby", titleId)');
    expect(source).toContain('panel.setAttribute("aria-describedby", messageId)');
    expect(source).toContain('this.content.setAttribute("inert", "")');
    expect(source).toContain('this.content.setAttribute("aria-hidden", "true")');
    expect(source).toContain("this.modalSiblingState.set(sibling");
    expect(source).toContain('sibling.setAttribute("inert", "")');
    expect(source).toContain('sibling.setAttribute("aria-hidden", "true")');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain("this.root.contains(target)");
    expect(source).toContain("element.checked");
    expect(source).toContain("this.actionHandler?.(currentRenderToken, actionId, checked)");
    expect(source).toContain("host.append(this.root)");
    expect(source).toContain("the parent already contains a semantic surface");
    expect(source).toContain('sourceText.setAttribute("dir", "auto")');
    expect(source).toContain('displayText.setAttribute("dir", "auto")');
    expect(source).toContain("this.groups.replaceChildren(...groupItems)");
    expect(source).toContain("mappings.append(...group.mappings.map");
    expect(source).toContain("displayText.textContent = mapping.displayText");
    expect(source).toContain("valueCode.textContent = String(mapping.value)");
    expect(source).toContain("this.heading.focus({ preventScroll: true })");
    expect(source).not.toContain("innerHTML");
    expect(source).not.toMatch(/role[^\n]+application/i);
  });

  it("clips the default surface and reveals a safe-area-aware keyboard or QA overlay", () => {
    const css = readRepoFile("src/styles/global.css");
    const hiddenRule = css.match(/\.semantic-surface \{[\s\S]*?\n\}/)?.[0] ?? "";
    const focusedRule = css.match(/\.semantic-surface:focus-within,[\s\S]*?\n\}/)?.[0] ?? "";

    expect(hiddenRule).toContain("width: 1px");
    expect(hiddenRule).toContain("height: 1px");
    expect(hiddenRule).toContain("clip: rect(0 0 0 0)");
    expect(hiddenRule).toContain("clip-path: inset(50%)");
    expect(focusedRule).toContain("var(--safe-area-top)");
    expect(focusedRule).toContain("var(--safe-area-right)");
    expect(focusedRule).toContain("var(--safe-area-bottom)");
    expect(focusedRule).toContain("var(--safe-area-left)");
    expect(focusedRule).toContain("clip-path: none");
    expect(css).toContain("outline: 4px solid");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain('.semantic-surface__control input[role="switch"]');
    expect(css).toContain(".semantic-surface__dialog-actions");
    expect(css).toContain('.semantic-surface__dialog-host[hidden]');
    expect(css).toContain('.semantic-surface__content[inert]');
    expect(css).toMatch(/\.semantic-surface__details\[hidden\] \{\s*display: none;\s*\}/);
    expect(css).toMatch(/\.semantic-surface__groups\[hidden\] \{\s*display: none;\s*\}/);
    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(css).toContain("min-inline-size: 0");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain("@media (max-width: 360px)");
    expect(css).toContain('.semantic-surface[data-semantic-qa-visible="true"]');
  });

  it("registers and destroys the runtime without changing the config signature or QA strings", () => {
    const source = readRepoFile("src/game/Game.ts");

    expect(source).toContain("createGameConfig(parent: string, dev = import.meta.env.DEV)");
    expect(source).toContain("preserveDrawingBuffer: dev");
    expect(source).toContain("dev ? qaViewportFromUrl(globalThis.location?.href) : undefined");
    expect(source).toContain("qaViewport ? Phaser.Scale.NONE : Phaser.Scale.RESIZE");
    expect(source).toContain("autoCenter: qaViewport ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH");
    expect(source).toContain("width: qaViewport?.width ?? 960");
    expect(source).toContain("height: qaViewport?.height ?? 640");
    expect(source).toContain("const semanticRuntime = createSemanticRuntime(parent)");
    expect(source).toContain("config.callbacks = {");
    expect(source).toContain("game.registry.set(SEMANTIC_RUNTIME_REGISTRY_KEY, semanticRuntime)");
    expect(source).toContain("game.events.once(Phaser.Core.Events.DESTROY, () => {");
    expect(source).toContain("semanticRuntime.destroy();");
    expect(source).toContain("motionPreferenceRuntime.destroy();");
  });
});
