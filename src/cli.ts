import { parseArgs } from "node:util";

const DEFAULT_LENGTH = 16;
const DEFAULT_MEMORABLE_LENGTH = 20;
const DEFAULT_WORDS = 3;

const showHelp = () => {
  console.log("Generates a secure password\r\n");
  console.log("Options:");
  console.log(
    `  -l, --length <n>: Password length [default: ${DEFAULT_LENGTH}, or ${DEFAULT_MEMORABLE_LENGTH} with --memorable]`,
  );
  console.log("  -m, --memorable: Generates a memorable password");
  console.log(
    "  -c, --non-memorable: Generates a non memorable password [default]",
  );
  console.log(
    "  -p, --pattern <regex>: Pattern to match for the generated password",
  );
  console.log(
    "  -i, --ignore-security-recommendations: Ignore security recommendations",
  );
  console.log(
    `  -s, -sN, --words <n>: Generate N memorable words (3-7 letters) separated by spaces [default: ${DEFAULT_WORDS}]`,
  );
  console.log("  -h, --help: Displays this help");
};

// Expand -s and -sN into --words <n> before parseArgs
const expandWordsArg = (argv: string[]): string[] => {
  const result: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    const match = arg.match(/^-s(\d+)$/);
    if (match) {
      result.push("--words", match[1]!);
    } else if (arg === "-s") {
      const next = argv[i + 1];
      if (next !== undefined && /^\d+$/.test(next)) {
        result.push("--words", next);
        i += 1;
      } else {
        result.push("--words", String(DEFAULT_WORDS));
      }
    } else {
      result.push(arg);
    }
  }
  return result;
};

export const runCli = async (argv = process.argv.slice(2)) => {
  const { values } = parseArgs({
    args: expandWordsArg(argv),
    options: {
      length: { type: "string", short: "l" },
      memorable: { type: "boolean", short: "m" },
      "non-memorable": { type: "boolean", short: "c" },
      pattern: { type: "string", short: "p" },
      "ignore-security-recommendations": { type: "boolean", short: "i" },
      words: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    showHelp();
    return;
  }

  const { generatePasswordWithOptions } = await import("./index.js");

  let memorable = values.memorable === true;
  if (values["non-memorable"]) memorable = false;

  const patternRaw = values.pattern;
  const pattern =
    typeof patternRaw === "string" ? new RegExp(patternRaw) : undefined;
  if (pattern) memorable = false;

  const words =
    values.words !== undefined ? Number(values.words) : undefined;

  const lengthRaw = values.length;
  const lengthValue =
    typeof lengthRaw === "string" ? Number(lengthRaw) : undefined;
  const length =
    lengthValue !== undefined
      ? lengthValue
      : words !== undefined
        ? undefined
        : memorable
          ? DEFAULT_MEMORABLE_LENGTH
          : DEFAULT_LENGTH;

  const ignoreSecurityRecommendations =
    values["ignore-security-recommendations"] === true;

  const options: {
    length?: number;
    memorable: boolean;
    pattern?: RegExp;
    ignoreSecurityRecommendations: boolean;
    words?: number;
  } = {
    memorable,
    ignoreSecurityRecommendations,
  };

  if (pattern) options.pattern = pattern;
  if (typeof length === "number" && Number.isFinite(length))
    options.length = length;
  if (words !== undefined) options.words = words;

  console.log(await generatePasswordWithOptions(options));
};
