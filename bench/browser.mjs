import { runPasswordBench, formatPasswordBench } from "./bench.mjs";
import { runConstraintsBench, formatConstraintsBench } from "./constraints.mjs";

const params = new URLSearchParams(globalThis.location?.search ?? "");
const fast = params.has("fast");
const log = !params.has("quiet");

const passwordOverrides = fast
  ? { warmup: 1, samples: 2, iters: 800, length: 12 }
  : {};
const constraintsOverrides = fast
  ? {
      warmup: 1,
      samples: 2,
      iters: 300,
      failIters: 50,
      largeIters: 40,
      hugeIters: 10,
      large: 256,
      huge: 512,
    }
  : {};

try {
  const password = await runPasswordBench(passwordOverrides);
  const constraints = await runConstraintsBench(constraintsOverrides);

  const results = { password, constraints };
  globalThis.__benchResults = results;

  if (log) {
    const output = [
      ...formatPasswordBench(password),
      "",
      ...formatConstraintsBench(constraints),
    ];
    for (const line of output) {
      console.log(line);
    }
  }
} catch (error) {
  globalThis.__benchError =
    error instanceof Error ? error.message : String(error);
  console.error(error);
} finally {
  globalThis.__benchDone = true;
}
