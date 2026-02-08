import {
  envNumber,
  now,
  median,
  formatCase,
  runtimeLabel,
  isCliEntry,
} from "./utils.mjs";

const DEFAULTS = {
  WARMUP: 2,
  SAMPLES: 5,
  ITERS: 20_000,
  LENGTH: 24,
};

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function concatCase(iters, length) {
  for (let i = 0; i < iters; i += 1) {
    let result = "";
    for (let j = 0; j < length; j += 1) {
      result += CHARS[(i + j) % CHARS.length];
    }
    void result;
  }
}

function arrayCase(iters, length) {
  for (let i = 0; i < iters; i += 1) {
    const chars = [];
    for (let j = 0; j < length; j += 1) {
      chars.push(CHARS[(i + j) % CHARS.length]);
    }
    const result = chars.join("");
    void result;
  }
}

export function runStructuresBench(overrides = {}) {
  const config = {
    warmup: envNumber("WARMUP", DEFAULTS.WARMUP),
    samples: envNumber("SAMPLES", DEFAULTS.SAMPLES),
    iters: envNumber("ITERS", DEFAULTS.ITERS),
    length: envNumber("LENGTH", DEFAULTS.LENGTH),
    ...overrides,
  };

  const cases = [];
  const { warmup, samples, iters, length } = config;

  const runCase = (name, ops, fn) => {
    for (let i = 0; i < warmup; i += 1) {
      fn();
    }
    const sampleTimes = [];
    for (let i = 0; i < samples; i += 1) {
      const start = now();
      fn();
      sampleTimes.push(now() - start);
    }
    const med = median(sampleTimes);
    cases.push({
      name,
      medianMs: med,
      opsPerSec: (ops / med) * 1000,
    });
  };

  const ops = iters * length;
  runCase("string concat", ops, () => concatCase(iters, length));
  runCase("array join", ops, () => arrayCase(iters, length));

  return {
    title: "Structure microbench",
    runtime: runtimeLabel(),
    config,
    cases,
  };
}

export function formatStructuresBench(result) {
  const lines = [];
  lines.push(result.title);
  lines.push(result.runtime);
  lines.push(
    `samples=${result.config.samples} warmup=${result.config.warmup} iters=${result.config.iters} length=${result.config.length}`,
  );
  lines.push("");
  for (const row of result.cases) {
    lines.push(formatCase(row));
  }
  return lines;
}

if (
  isCliEntry(
    typeof process !== "undefined" ? process.argv : null,
    "bench/structures.mjs",
  )
) {
  const result = runStructuresBench();
  for (const line of formatStructuresBench(result)) {
    console.log(line);
  }
}
