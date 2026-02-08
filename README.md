# Password Generator

Password generator with secure defaults, async WebCrypto randomness, and optional memorable mode for Node 20+ and modern browsers.

- ESM only, tree-shakeable
- Async API (Promise-based)
- Secure defaults (non-memorable)
- Bun build/test + Playwright browser checks

## Install

```bash
npm install password-generator
```

## CLI

```bash
password-generator -h
```

Examples:

```bash
password-generator
password-generator -l 30
password-generator -m
password-generator -s
password-generator -s4
password-generator -p "[\d\W\w]" -i
```

Notes:

- CLI defaults are length 16 for non-memorable passwords and length 20 for memorable passwords.
- `-s` generates 3 memorable words (3-7 letters) separated by spaces. `-sN` sets the word count.

## Usage (Node/Bun)

```ts
import { generatePassword } from "password-generator";

const pass = await generatePassword();
```

Memorable mode:

```ts
const pass = await generatePassword(20, true);
```

With options:

```ts
import { generatePasswordWithOptions } from "password-generator";

const pass = await generatePasswordWithOptions({
  length: 16,
  memorable: false,
  pattern: /\d/,
  prefix: "foo-",
  ignoreSecurityRecommendations: true,
});
```

Deterministic entropy for tests:

```ts
const pass = await generatePasswordWithOptions({
  length: 16,
  memorable: false,
  entropy: "seed",
});
```

Passphrase mode (memorable words, 3-7 letters each):

```ts
const passphrase = await generatePasswordWithOptions({
  words: 3,
});
```

`words` mode ignores `pattern` and does not support `prefix`.

## Usage (Browser)

```html
<script type="module">
  import { generatePassword } from "./dist/index.js";

  const pass = await generatePassword();
  console.log(pass);
</script>
```

## Security Recommendations

By default, the generator enforces a minimum estimated entropy of 64 bits. If your requested settings fall below this threshold, an error is thrown with a recommendation. To bypass the check (for testing or policy-driven constraints), pass `ignoreSecurityRecommendations: true`.

## API

```ts
export type GenerateOptions = {
  length?: number;
  memorable?: boolean;
  pattern?: RegExp;
  prefix?: string;
  ignoreSecurityRecommendations?: boolean;
  entropy?: Uint8Array | string;
  words?: number;
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

## Migration (v2 -> v3)

- `generatePassword()` is now async. Update your code to `await generatePassword()`.
- CommonJS `require()` is no longer supported. Use ESM `import` instead.
- Node 20+ is required.
- Defaults are now non-memorable with `length: 12`.
- Security recommendations enforce minimum entropy unless `ignoreSecurityRecommendations: true` is set.
- Legacy UMD/global builds and Bower/Ender integrations are removed.

## Development

```bash
bun install
bun run format
bun test --coverage
bun run build:all
bunx playwright install --with-deps chromium
bun run test:browser
bun run test:all
bun run ci:local
```

```bash
bun run publish
```

`ci:local` requires `act` installed locally.

## Benchmarks + Changelog

- `BENCHMARKS.md`
- `CHANGELOG.md`

## License

MIT
