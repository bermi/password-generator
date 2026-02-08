const env = typeof process !== "undefined" ? (process.env ?? {}) : {};

export function envNumber(name, fallback) {
  const raw = env[name];
  const value = raw === undefined ? fallback : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function now() {
  if (
    globalThis.performance &&
    typeof globalThis.performance.now === "function"
  ) {
    return globalThis.performance.now();
  }
  return Date.now();
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function formatCase({ name, medianMs, opsPerSec }) {
  const opsPerSecStr = Math.round(opsPerSec).toLocaleString("en-US");
  const medStr = medianMs.toFixed(3).padStart(8, " ");
  return `${name.padEnd(38)} ${medStr} ms  ${opsPerSecStr} ops/s`;
}

export function runtimeLabel() {
  if (typeof Bun !== "undefined" && Bun?.version) {
    return `Bun ${Bun.version}`;
  }
  if (typeof process !== "undefined" && process?.versions?.node) {
    return `Node ${process.versions.node}`;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent) {
    return navigator.userAgent;
  }
  return "unknown";
}

export function isCliEntry(argv, filename) {
  if (!argv || !argv[1]) {
    return false;
  }
  const target = argv[1];
  return (
    target.endsWith(filename) || target.endsWith(filename.replace(/\//g, "\\"))
  );
}
