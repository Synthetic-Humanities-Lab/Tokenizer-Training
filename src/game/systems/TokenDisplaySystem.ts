export function displayTokenSegment(token: string): string {
  if (token.length === 0) {
    return "[empty]";
  }

  return [...token].map((character) => {
    if (character === "\t") return "[tab]";
    if (character === "\n") return "[newline]";
    return character;
  }).join("");
}

export function tokenSplitLine(tokenStrings: string[]): string {
  const segments = tokenStrings.map((token) => `<${displayTokenSegment(token)}>`);
  return `Tokens ${segments.length}: ${segments.join(" ")}`;
}
