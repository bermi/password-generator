#!/usr/bin/env node

try {
  const { runCli } = await import("../dist/cli.js");
  await runCli();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
