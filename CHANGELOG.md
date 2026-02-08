# Changelog

## 3.0.0 - 2026-02-07

### Breaking Changes

- `generatePassword()` is now async and returns a `Promise<string>`.
- ESM-only package output (`type: module`); CommonJS `require()` is no longer supported.
- Node 20+ is required.
- Defaults are now non-memorable with `length: 12`.
- Security recommendations enforce a minimum entropy threshold unless `ignoreSecurityRecommendations: true` is set.
- Legacy UMD/global builds and Bower/Ender integrations were removed.

### Migration (v2 -> v3)

- Update calls to `await generatePassword(...)` or use `generatePasswordWithOptions` with `await`.
- Switch CommonJS `require()` to ESM `import` and ensure Node 20+.
- If you used short lengths, restrictive patterns, or memorable mode, handle new security recommendations by increasing length/pattern breadth or passing `ignoreSecurityRecommendations: true`.
- Update CLI expectations: defaults are non-memorable, `-m` uses a longer length, and `-s/-sN` generates passphrases.

### Added

- TypeScript-first core with strict typing.
- WebCrypto-based randomness for Node and browser.
- Deterministic entropy option for tests and simulations.
- Passphrase mode via `words` (memorable 3-7 letter words).
- Bun build/test pipeline, type tests, and Playwright browser checks.
- Benchmark harness and documentation.

### Changed

- CLI now calls the async API and supports secure defaults.
- CLI adds `-s` / `-sN` for passphrase generation.
- Build output ships as ESM with explicit exports and declaration files.
