import { generatePasswordWithOptions } from "../dist/index.js";
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
  ITERS: 5_000,
  LENGTH: 12,
};

const runGenerator = async (iters, options) => {
  for (let i = 0; i < iters; i += 1) {
    await generatePasswordWithOptions(options);
  }
};

export const runPasswordBench = async (overrides = {}) => {
  const config = {
    warmup: envNumber("WARMUP", DEFAULTS.WARMUP),
    samples: envNumber("SAMPLES", DEFAULTS.SAMPLES),
    iters: envNumber("ITERS", DEFAULTS.ITERS),
    length: envNumber("LENGTH", DEFAULTS.LENGTH),
    ...overrides,
  };

  const cases = [];
  const { warmup, samples, iters, length } = config;

  const runCase = async (name, ops, fn) => {
    for (let i = 0; i < warmup; i += 1) {
      await fn();
    }
    const sampleTimes = [];
    for (let i = 0; i < samples; i += 1) {
      const start = now();
      await fn();
      sampleTimes.push(now() - start);
    }
    const med = median(sampleTimes);
    cases.push({
      name,
      medianMs: med,
      opsPerSec: (ops / med) * 1000,
    });
  };

  await runCase("non-memorable (length 12)", iters, () =>
    runGenerator(iters, { length, memorable: false }),
  );

  await runCase("memorable (length 20)", iters, () =>
    runGenerator(iters, { length: 20, memorable: true }),
  );

  await runCase("numeric pattern (length 12)", iters, () =>
    runGenerator(iters, {
      length,
      memorable: false,
      pattern: /\d/,
      ignoreSecurityRecommendations: true,
    }),
  );

  await runCase("prefixed (length 16)", iters, () =>
    runGenerator(iters, {
      length: length + 4,
      memorable: false,
      pattern: /[A-Z]/,
      prefix: "ABCD-",
      ignoreSecurityRecommendations: true,
    }),
  );

  await runCase("passphrase (3 words)", iters, () =>
    runGenerator(iters, {
      words: 3,
    }),
  );

  return {
    title: "Password generator microbench",
    runtime: runtimeLabel(),
    config,
    cases,
  };
};

export const formatPasswordBench = (result) => {
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
};

if (
  isCliEntry(
    typeof process !== "undefined" ? process.argv : null,
    "bench/bench.mjs",
  )
) {
  const result = await runPasswordBench();
  for (const line of formatPasswordBench(result)) {
    console.log(line);
  }
}
