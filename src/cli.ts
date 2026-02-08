type ArgValue = string | boolean | string[] | undefined;

type ParsedArgs = {
  _: string[];
  [key: string]: ArgValue;
};

const parseArgs = (args: string[]): ParsedArgs => {
  const parsed: ParsedArgs = { _: [] };
  const set = (key: string, value: ArgValue = true) => {
    parsed[key] = value;
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === "--") {
      parsed._.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const [rawKey, rawValue] = arg.slice(2).split("=");
      if (!rawKey) {
        continue;
      }
      if (rawValue !== undefined) {
        set(rawKey, rawValue);
        continue;
      }
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        set(rawKey, next);
        i += 1;
      } else {
        set(rawKey, true);
      }
      continue;
    }
    if (arg.startsWith("-")) {
      const [rawKey, rawValue] = arg.slice(1).split("=");
      if (!rawKey) {
        continue;
      }
      if (rawValue !== undefined) {
        set(rawKey, rawValue);
        continue;
      }
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        set(rawKey, next);
        i += 1;
      } else {
        set(rawKey, true);
      }
      continue;
    }
    parsed._.push(arg);
  }

  return parsed;
};

const pickValue = (args: ParsedArgs, keys: string[]): ArgValue => {
  for (const key of keys) {
    if (args[key] !== undefined) {
      return args[key];
    }
  }
  return undefined;
};

const asBoolean = (value: ArgValue): boolean => {
  if (value === undefined) return false;
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized !== "false" && normalized !== "0";
  }
  return Boolean(value);
};

const asString = (value: ArgValue): string | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : String(value);
};

const puts = console.log;

const DEFAULT_LENGTH = 16;
const DEFAULT_MEMORABLE_LENGTH = 20;
const DEFAULT_WORDS = 3;

const options = [
  {
    flags: "-l, --length <n>",
    description: `Password length [default: ${DEFAULT_LENGTH}, or ${DEFAULT_MEMORABLE_LENGTH} with --memorable]`,
  },
  { flags: "-m, --memorable", description: "Generates a memorable password" },
  {
    flags: "-c, --non-memorable",
    description: "Generates a non memorable password [default]",
  },
  {
    flags: "-p, --pattern <regex>",
    description: "Pattern to match for the generated password",
  },
  {
    flags: "-i, --ignore-security-recommendations",
    description: "Ignore security recommendations",
  },
  {
    flags: "-s, -sN, --words <n>",
    description:
      "Generate N memorable words (3-7 letters) separated by spaces [default: 3]",
  },
  { flags: "-h, --help", description: "Displays this help" },
];

const showHelp = () => {
  puts("Generates a secure password\r\n");
  puts("Options:");
  for (const option of options) {
    puts(`  ${option.flags}: ${option.description}`);
  }
};

export const runCli = async (argv = process.argv.slice(2)) => {
  const parsed = parseArgs(argv);
  const help = asBoolean(pickValue(parsed, ["h", "help"]));
  if (help) {
    showHelp();
    return;
  }

  const { generatePasswordWithOptions } = await import("./index.js");
  const patternRaw = asString(pickValue(parsed, ["p", "pattern"]));
  const suffixedWordsKey = Object.keys(parsed).find((key) =>
    /^s\d+$/.test(key),
  );
  const wordsRaw = pickValue(parsed, ["s", "words", "phrase", "passphrase"]);
  let words: number | undefined;
  if (suffixedWordsKey) {
    words = Number(suffixedWordsKey.slice(1));
  } else if (wordsRaw !== undefined) {
    words = wordsRaw === true ? DEFAULT_WORDS : Number(wordsRaw);
  }

  const hasMemorable = pickValue(parsed, ["m", "memorable"]) !== undefined;
  const hasNonMemorable =
    pickValue(parsed, ["c", "non-memorable", "nonmemorable"]) !== undefined;
  let memorable = hasMemorable ? true : false;
  if (hasNonMemorable) {
    memorable = false;
  }

  const pattern = patternRaw ? new RegExp(patternRaw) : undefined;
  if (pattern) {
    memorable = false;
  }

  const lengthRaw = asString(pickValue(parsed, ["l", "length"]));
  const lengthValue = lengthRaw !== undefined ? Number(lengthRaw) : undefined;
  const length =
    lengthValue !== undefined
      ? lengthValue
      : words !== undefined
        ? undefined
        : memorable
          ? DEFAULT_MEMORABLE_LENGTH
          : DEFAULT_LENGTH;
  const ignoreSecurityRecommendations = asBoolean(
    pickValue(parsed, [
      "i",
      "ignore-security-recommendations",
      "ignoreSecurityRecommendations",
    ]),
  );

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

  if (pattern) {
    options.pattern = pattern;
  }
  if (typeof length === "number" && Number.isFinite(length)) {
    options.length = length;
  }
  if (words !== undefined) {
    options.words = words;
  }

  const pass = await generatePasswordWithOptions(options);

  puts(pass);
};
