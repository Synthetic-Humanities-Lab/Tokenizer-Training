export interface PortHygieneOptions {
  indent?: string;
  requestedLabel?: string;
}

export function playtestPortHygieneLines(
  port: string,
  options: PortHygieneOptions = {}
): string[] {
  const indent = options.indent ?? "";
  const requestedLabel = options.requestedLabel ?? "requested";
  const numericPort = Number.parseInt(port, 10);
  const rangeEnd = Number.isInteger(numericPort) ? Math.min(65535, numericPort + 40) : undefined;
  const range = rangeEnd ? `${port}-${rangeEnd}` : port;

  return [
    `${indent}Port hygiene:`,
    `${indent}- Inspect the ${requestedLabel} listener: lsof -nP -iTCP:${port} -sTCP:LISTEN`,
    `${indent}- Inspect nearby Vite fallback listeners: lsof -nP -iTCP:${range} -sTCP:LISTEN`,
    `${indent}- Stop only a confirmed stale Vite process: Ctrl-C its terminal, or use kill <PID> if the terminal is gone.`,
    `${indent}- Do not kill a listener that is already serving an active tester session.`
  ];
}
