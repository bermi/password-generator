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
  ITERS: 2_000,
  FAIL_ITERS: 200,
  LARGE_ITERS: 200,
  HUGE_ITERS: 40,
  LARGE: 1024,
  HUGE: 4096,
};

const runGenerator = async (iters, options) => {
  for (let i = 0; i < iters; i += 1) {
    await generatePasswordWithOptions(options);
  }
  return 0;
};

const runFailures = async (iters, options) => {
  let errors = 0;
  for (let i = 0; i < iters; i += 1) {
    try {
      await generatePasswordWithOptions(options);
    } catch {
      errors += 1;
    }
  }
  return errors;
};

export const runConstraintsBench = async (overrides = {}) => {
  const config = {
    warmup: envNumber("WARMUP", DEFAULTS.WARMUP),
    samples: envNumber("SAMPLES", DEFAULTS.SAMPLES),
    iters: envNumber("ITERS", DEFAULTS.ITERS),
    failIters: envNumber("FAIL_ITERS", DEFAULTS.FAIL_ITERS),
    largeIters: envNumber("LARGE_ITERS", DEFAULTS.LARGE_ITERS),
    hugeIters: envNumber("HUGE_ITERS", DEFAULTS.HUGE_ITERS),
    large: envNumber("LARGE", DEFAULTS.LARGE),
    huge: envNumber("HUGE", DEFAULTS.HUGE),
    ...overrides,
  };

  const cases = [];
  const { warmup, samples } = config;

  const runCase = async ({ name, ops, fn }) => {
    for (let i = 0; i < warmup; i += 1) {
      await fn();
    }
    const sampleTimes = [];
    let errors = 0;
    for (let i = 0; i < samples; i += 1) {
      const start = now();
      errors += await fn();
      sampleTimes.push(now() - start);
    }
    const med = median(sampleTimes);
    cases.push({
      name,
      medianMs: med,
      opsPerSec: (ops / med) * 1000,
      errors: Math.round(errors / samples),
    });
  };

  await runCase({
    name: "non-memorable (length 12)",
    ops: config.iters,
    fn: () => runGenerator(config.iters, { length: 12, memorable: false }),
  });

  await runCase({
    name: "memorable (length 20)",
    ops: config.iters,
    fn: () => runGenerator(config.iters, { length: 20, memorable: true }),
  });

  await runCase({
    name: "numeric pattern (length 12, override)",
    ops: config.iters,
    fn: () =>
      runGenerator(config.iters, {
        length: 12,
        memorable: false,
        pattern: /\d/,
        ignoreSecurityRecommendations: true,
      }),
  });

  await runCase({
    name: "deterministic entropy (length 16)",
    ops: config.iters,
    fn: () =>
      runGenerator(config.iters, {
        length: 16,
        memorable: false,
        entropy: "bench-seed",
      }),
  });

  await runCase({
    name: `large length (${config.large})`,
    ops: config.largeIters,
    fn: () =>
      runGenerator(config.largeIters, {
        length: config.large,
        memorable: false,
      }),
  });

  await runCase({
    name: `huge length (${config.huge})`,
    ops: config.hugeIters,
    fn: () =>
      runGenerator(config.hugeIters, {
        length: config.huge,
        memorable: false,
      }),
  });

  await runCase({
    name: "security reject (memorable length 10)",
    ops: config.failIters,
    fn: () =>
      runFailures(config.failIters, {
        length: 10,
        memorable: true,
      }),
  });

  await runCase({
    name: "security reject (digits length 8)",
    ops: config.failIters,
    fn: () =>
      runFailures(config.failIters, {
        length: 8,
        memorable: false,
        pattern: /\d/,
      }),
  });

  await runCase({
    name: "invalid pattern (no matches)",
    ops: config.failIters,
    fn: () =>
      runFailures(config.failIters, {
        length: 12,
        memorable: false,
        pattern: /test/,
      }),
  });

  return {
    title: "Constraint + failure model microbench",
    runtime: runtimeLabel(),
    config,
    cases,
  };
};

export const formatConstraintsBench = (result) => {
  const lines = [];
  lines.push(result.title);
  lines.push(result.runtime);
  lines.push(
    `samples=${result.config.samples} warmup=${result.config.warmup} iters=${result.config.iters} large=${result.config.large} huge=${result.config.huge}`,
  );
  lines.push("");
  for (const row of result.cases) {
    const base = formatCase(row);
    const suffix = row.errors ? `  errors=${row.errors}` : "";
    lines.push(`${base}${suffix}`);
  }
  return lines;
};

if (
  isCliEntry(
    typeof process !== "undefined" ? process.argv : null,
    "bench/constraints.mjs",
  )
) {
  const result = await runConstraintsBench();
  for (const line of formatConstraintsBench(result)) {
    console.log(line);
  }
}
