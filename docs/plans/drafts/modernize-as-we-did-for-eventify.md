# Password Generator v3 Modernization Plan (modeled after Eventify v3)

Last updated: 2026-02-07

**Overview**
This plan mirrors the Eventify v2 -> v3 modernization: TypeScript-first, ESM-only, strict configs, Bun-based build/test, Playwright browser checks, and benchmark discipline. The primary functional change is moving to async password generation backed by WebCrypto.

**Goals**

- Rewrite the core in TypeScript with strict typing.
- Make the public API async and WebCrypto-backed.
- Ship ESM-only output with explicit exports and declaration files.
- Replace legacy Grunt/Make-based workflows with Bun.
- Add unit, type, and browser tests with CI parity.
- Document breaking changes and a clear migration path.

**Non-Goals**

- Keep legacy UMD/global builds or Ender/Bower integrations.
- Support Node versions below 20.
- Preserve synchronous generation as the primary API.

**Key Decisions**

- The default API becomes async: `generatePassword(...)` returns a Promise.
- Randomness uses WebCrypto; Node uses `node:crypto` with async `randomBytes`.
- Distribution is ESM-only with `exports` and `sideEffects: false`.
- Tooling matches Eventify: Bun build/test, Prettier formatting, Playwright browser tests.

**Migration Map (v2 -> v3)**
| Area | v2 | v3 plan |
| --- | --- | --- |
| Module format | CommonJS + UMD global | ESM-only (`type: module`) |
| Runtime | Node 0.6+ | Node 20+ |
| API | `generatePassword()` sync | `await generatePassword()` async |
| Randomness | sync `crypto.getRandomValues`/`randomBytes` | async WebCrypto + async `randomBytes` |
| Build | Grunt/Make | Bun build + `tsc` for types |
| Tests | Mocha + Make | Bun test + Playwright |
| CI | Travis/Testling | GitHub Actions |

**Target API**
TypeScript signature:

```ts
export type GenerateOptions = {
  length?: number;
  memorable?: boolean;
  pattern?: RegExp;
  prefix?: string;
};

export async function generatePassword(
  length?: number,
  memorable?: boolean,
  pattern?: RegExp,
  prefix?: string,
): Promise<string>;

export async function generatePasswordWithOptions(
  options?: GenerateOptions,
): Promise<string>;
```

Usage example:

```ts
import { generatePassword } from "password-generator";

const pass = await generatePassword(12, true);
```

CLI example:

```ts
#!/usr/bin/env node
import { generatePasswordWithOptions } from "../dist/index.js";

const pass = await generatePasswordWithOptions({
  length: 16,
  memorable: false,
});
process.stdout.write(`${pass}\n`);
```

**Async WebCrypto Randomness**
Core helper sketch:

```ts
import { randomBytes } from "node:crypto";

export async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint8Array(length);
    globalThis.crypto.getRandomValues(buffer);
    return buffer;
  }

  if (typeof randomBytes === "function") {
    return new Uint8Array(await randomBytes(length));
  }

  throw new Error("No secure random number generator available.");
}
```

**Project Structure (target)**

```text
src/
  index.ts
  random.ts
bench/
  bench.mjs
  browser.mjs
  utils.mjs
  patterns.mjs
  structures.mjs
.github/workflows/
  ci.yml
  browser.yml
```

**TypeScript Strictness**
`tsconfig.json` baseline (match Eventify):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true,
    "rootDir": "src",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

**Build and Package Outputs (Bun)**
`package.json` sketch (mirror Eventify structure and scripts):

```json
{
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "browser": "./dist/index.js",
      "bun": "./dist/index.js",
      "node": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "engines": { "node": ">=20" },
  "scripts": {
    "check": "bun x tsc -p tsconfig.json --noEmit",
    "build": "bun build src/index.ts --outdir dist --entry-naming \"[name].js\" --format esm --target=browser --sourcemap=linked",
    "build:types": "bun x tsc -p tsconfig.types.json",
    "build:all": "bun run build && bun run build:types",
    "bench": "bun run build && bun run bench/bench.mjs",
    "bench:patterns": "bun run bench/patterns.mjs",
    "bench:structures": "bun run bench/structures.mjs",
    "bench:node": "bun run build && node bench/bench.mjs",
    "bench:node:patterns": "node bench/patterns.mjs",
    "bench:node:structures": "node bench/structures.mjs",
    "bench:browser": "bun run build && bunx playwright test -c bench/playwright.config.mjs",
    "bench:all": "bun run bench && bun run bench:patterns && bun run bench:structures && bun run bench:node && bun run bench:node:patterns && bun run bench:node:structures && bun run bench:browser",
    "format": "bunx prettier --write .",
    "format:check": "bunx prettier --check .",
    "typecheck:tests": "bun x tsc -p tests/tsconfig.types.json",
    "test": "bun test",
    "test:browser": "bun run build && bunx playwright test",
    "test:all": "bun test --coverage && bun run typecheck:tests && bun run build && bunx playwright test",
    "publish": "bun run build:all && npm publish"
  }
}
```

**Formatting and Git Hooks**
Pre-commit hook (same pattern as Eventify):

```bash
#!/usr/bin/env bash
set -euo pipefail

mapfile -t files < <(git diff --cached --name-only --diff-filter=ACM)

if [ ${#files[@]} -eq 0 ]; then
  exit 0
fi

format_files=()
for file in "${files[@]}"; do
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.json|*.jsonc|*.md|*.css|*.html|*.graphql|*.gql|*.yml|*.yaml)
      format_files+=("$file")
      ;;
  esac
done

if [ ${#format_files[@]} -eq 0 ]; then
  exit 0
fi

bunx prettier --write --ignore-unknown -- "${format_files[@]}"

git add -- "${format_files[@]}"
```

**Testing Plan**

- Unit tests moved to Bun, updated for async API.
- Type tests in `tests/types.test-d.ts` run via `tsc` in `tests/tsconfig.types.json`.
- Playwright browser tests exercise the ESM bundle.

**CI Workflows (GitHub Actions)**
`ci.yml` (unit + type + Playwright like Eventify):

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.3.1"
      - name: Install dependencies
        run: bun install --no-progress --registry https://registry.npmjs.org/
      - name: Unit tests (Bun)
        run: bun test --coverage
      - name: Type tests (tsc)
        run: bun run typecheck:tests
      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium
      - name: Browser tests (Playwright)
        run: bun run test:browser
```

`browser.yml` (browser-only workflow parity):

```yaml
name: Browser Tests

on:
  push:
  pull_request:

jobs:
  browser:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.3.1"
      - name: Install dependencies
        run: bun install --no-progress --registry https://registry.npmjs.org/
      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium
      - name: Browser tests (Playwright)
        run: bun run test:browser
```

**Benchmarking (Bun Tasks + BENCHMARKS.md)**
Add a benchmark harness and document results like Eventify. Example harness:

```js
// bench/bench.mjs
import { generatePassword } from "../dist/index.js";

const iterations = 20000;
const start = performance.now();
for (let i = 0; i < iterations; i += 1) {
  await generatePassword(12, true);
}
const elapsed = performance.now() - start;
const ops = Math.round((iterations / elapsed) * 1000);
console.log(
  `generatePassword (memorable) - ${elapsed.toFixed(2)} ms, ${ops} ops/s`,
);
```

Template for `BENCHMARKS.md`:

```md
# Benchmarks

## Commands

- bun run bench
- bun run bench:patterns
- bun run bench:structures
- bun run bench:node
- bun run bench:browser
- bun run bench:all

## Environment

- Date: 2026-02-07
- Bun: 1.3.1
- Node: 20.x
- Browser: Playwright Chromium
```

**Docs and Migration Notes**

- Update README with ESM + async examples, CLI usage, and Node 20+ requirement.
- Add migration section mapping sync usage to async usage with example.
- Add `CHANGELOG.md` with a 3.0.0 breaking section.

Migration snippet example:

```md
### Migration (v2 -> v3)

- `generatePassword()` is now async. Update your code to `await generatePassword()`.
- CommonJS `require()` is no longer supported. Use ESM imports instead.
- Node 20+ is required.
```

**Release Checklist**

- bun run build:all
- bun run test:all
- Verify CLI behavior with async generation
- Confirm dist outputs for Node and browser
- Update README + CHANGELOG

**Risks and Mitigations**

- Async API breakage for sync consumers. Mitigation: clear migration docs and examples.
- Crypto availability differences across environments. Mitigation: explicit error message.
- ESM migration friction. Mitigation: explicit exports map and docs.

**Done Criteria**

- All tests pass in CI, including Playwright.
- `dist/` contains ESM bundle and `.d.ts` files.
- README and CHANGELOG accurately reflect the v3 API and migration notes.
