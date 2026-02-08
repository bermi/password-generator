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
  ITERS: 2_000,
};

const PATTERNS = [
  { name: "digits", pattern: /\d/ },
  { name: "word", pattern: /\w/ },
  { name: "hex", pattern: /[a-f0-9]/i },
  { name: "symbols", pattern: /[!@#$%^&*]/ },
];

function buildValidChars(pattern) {
  const validChars = [];
  for (let i = 33; i <= 126; i += 1) {
    const char = String.fromCharCode(i);
    if (char.match(pattern)) {
      validChars.push(char);
    }
  }
  return validChars;
}

export function runPatternBench(overrides = {}) {
  const config = {
    warmup: envNumber("WARMUP", DEFAULTS.WARMUP),
    samples: envNumber("SAMPLES", DEFAULTS.SAMPLES),
    iters: envNumber("ITERS", DEFAULTS.ITERS),
    ...overrides,
  };

  const runCase = (name, ops, fn) => {
    for (let i = 0; i < config.warmup; i += 1) {
      fn();
    }
    const sampleTimes = [];
    for (let i = 0; i < config.samples; i += 1) {
      const start = now();
      fn();
      sampleTimes.push(now() - start);
    }
    const med = median(sampleTimes);
    return {
      name,
      medianMs: med,
      opsPerSec: (ops / med) * 1000,
    };
  };

  const cases = PATTERNS.map(({ name, pattern }) =>
    runCase(`build valid chars (${name})`, config.iters * 94, () => {
      for (let i = 0; i < config.iters; i += 1) {
        buildValidChars(pattern);
      }
    }),
  );

  return {
    title: "Pattern microbench",
    runtime: runtimeLabel(),
    config,
    suites: [
      {
        name: "regex pattern build",
        cases,
      },
    ],
  };
}

export function formatPatternBench(result) {
  const lines = [];
  lines.push(result.title);
  lines.push(result.runtime);
  lines.push(
    `samples=${result.config.samples} warmup=${result.config.warmup} iters=${result.config.iters}`,
  );
  lines.push("");
  for (const suite of result.suites) {
    lines.push(`Suite: ${suite.name}`);
    for (const row of suite.cases) {
      lines.push(formatCase(row));
    }
    lines.push("");
  }
  return lines;
}

if (
  isCliEntry(
    typeof process !== "undefined" ? process.argv : null,
    "bench/patterns.mjs",
  )
) {
  const result = runPatternBench();
  for (const line of formatPatternBench(result)) {
    console.log(line);
  }
}
