export const modernizeAsWeDidForEventifyPlan = {
  title: "Password Generator modernization plan (modeled after Eventify v3)",
  lastUpdated: "2026-02-07",
  context:
    "Modernize the v2-era password-generator to a v3-style release with ESM, TypeScript, strict tooling, and async WebCrypto-based randomness.",
  goals: [
    "Move core implementation to TypeScript with strict type checking.",
    "Switch public API to async WebCrypto-backed generation.",
    "Ship ESM-only distribution with explicit exports and type declarations.",
    "Replace legacy build tooling with Bun-based build and test flow.",
    "Raise quality bar with unit, type, and browser test coverage.",
    "Refresh docs and changelog with clear migration guidance.",
  ],
  nonGoals: [
    "Keep the legacy UMD/global build or old Ender/Bower integrations.",
    "Support Node versions below 20.",
    "Keep synchronous password generation as the primary API.",
  ],
  decisions: [
    "Async API: generatePassword returns a Promise and relies on WebCrypto randomness.",
    "Distribution: ESM-only with an exports map and sideEffects false.",
    "Tooling: Bun for build/test, Prettier for formatting, GitHub Actions for CI.",
  ],
  steps: [
    {
      id: "01-audit",
      title: "Baseline audit and migration map",
      tasks: [
        "Inventory current API surface (CLI, CommonJS export, browser global).",
        "List all user-facing options (length, memorable, pattern, prefix).",
        "Record behavior edge cases and error messages to preserve or update.",
        "Define breaking changes and replacements for the migration guide.",
      ],
      exitCriteria: [
        "Written migration notes outline old-to-new API mappings.",
        "Decision recorded on async API and dropped legacy targets.",
      ],
    },
    {
      id: "02-core",
      title: "Rewrite core in TypeScript",
      tasks: [
        "Create src/index.ts with a typed async generatePassword API.",
        "Implement async random byte sourcing using WebCrypto.",
        "Preserve current memorable and pattern behaviors.",
        "Eliminate recursion for random selection to avoid call stack risks.",
      ],
      exitCriteria: [
        "TypeScript core compiles under strict settings.",
        "Async password generation matches existing output expectations.",
      ],
    },
    {
      id: "03-random",
      title: "Async WebCrypto random strategy",
      tasks: [
        "Browser path: use globalThis.crypto.getRandomValues and wrap in Promise.",
        "Node path: use globalThis.crypto.webcrypto when available or node:crypto randomBytes (promises).",
        "Surface a clear error when no secure RNG is available.",
      ],
      exitCriteria: [
        "Single async random source utility used by all code paths.",
        "Deterministic error messages for missing crypto.",
      ],
    },
    {
      id: "04-build",
      title: "Modern build and package outputs",
      tasks: [
        "Add tsconfig.json and tsconfig.types.json with strict options.",
        "Add Bun build pipeline to emit dist/index.js and dist/index.d.ts.",
        "Update package.json with type module, exports map, files list, and engines >= 20.",
        "Update CLI entry to ESM and async main.",
      ],
      exitCriteria: [
        "bun run build:all produces dist outputs and types.",
        "Package metadata cleanly resolves ESM and types.",
      ],
    },
    {
      id: "05-tests",
      title: "Testing and coverage lift",
      tasks: [
        "Port unit tests to Bun and update for async API.",
        "Add type tests to validate public TypeScript types.",
        "Add Playwright browser tests that call the ESM bundle.",
        "Add a test:all script to run unit, type, and browser checks.",
      ],
      exitCriteria: [
        "CI can run tests in Node and browser contexts.",
        "Async API is fully exercised by tests.",
      ],
    },
    {
      id: "06-tooling",
      title: "Tooling cleanup and formatting",
      tasks: [
        "Remove Grunt, Makefile, Travis, and JSHint configs.",
        "Add Prettier config and a pre-commit format hook.",
        "Update .gitignore for modern tooling artifacts.",
      ],
      exitCriteria: [
        "Repository has a single formatting path and no legacy build files.",
      ],
    },
    {
      id: "07-docs",
      title: "Docs, changelog, and migration guide",
      tasks: [
        "Rewrite README with ESM + async examples and CLI usage.",
        "Add a v3 changelog entry with breaking changes.",
        "Add a migration section mapping old sync usage to async usage.",
      ],
      exitCriteria: ["Docs explain async usage and environment requirements."],
    },
    {
      id: "08-ci",
      title: "CI workflows",
      tasks: [
        "Add GitHub Actions workflow for unit + type tests.",
        "Add browser workflow for Playwright tests.",
        "Add a local CI helper script similar to act usage.",
      ],
      exitCriteria: ["CI passes on PRs with Node 20+ and Bun."],
    },
    {
      id: "09-release",
      title: "Release readiness",
      tasks: [
        "Validate dist outputs for Node and browser usage.",
        "Confirm CLI behavior with async generation.",
        "Update release process to build before publish.",
      ],
      exitCriteria: [
        "Release checklist validated and publish script in place.",
      ],
    },
  ],
  bestPractices: [
    "Prefer ESM with explicit exports and sideEffects false for tree shaking.",
    "Keep a strict TypeScript configuration and type tests for public APIs.",
    "Use async WebCrypto-backed randomness and avoid Math.random.",
    "Run unit, type, and browser tests in CI.",
    "Document breaking changes and provide migration notes.",
    "Keep formatting automated via pre-commit hooks.",
    "Ship dist outputs and declarations as part of release artifacts.",
  ],
  risks: [
    "Async API is a breaking change for sync callers and CLI usage.",
    "Browser and Node crypto availability can vary in older environments.",
    "Bundler and ESM changes may require updates in consumer apps.",
  ],
};

export default modernizeAsWeDidForEventifyPlan;
