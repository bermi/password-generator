var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// src/random.ts
var crypto, MAX_RANDOM_BYTES = 65536, getRandomBytes = async (length) => {
  if (!Number.isFinite(length) || length < 0) {
    throw new RangeError("length must be a non-negative finite number");
  }
  const buffer = new Uint8Array(length);
  for (let offset = 0;offset < length; offset += MAX_RANDOM_BYTES) {
    const end = Math.min(offset + MAX_RANDOM_BYTES, length);
    crypto.getRandomValues(buffer.subarray(offset, end));
  }
  return buffer;
}, createDeterministicRandomBytes = async (entropy, cryptoSource = crypto) => {
  if (entropy.length === 0) {
    throw new RangeError("entropy must not be empty");
  }
  if (!cryptoSource.subtle) {
    throw new Error("WebCrypto subtle is required for deterministic entropy");
  }
  const keyData = new Uint8Array(entropy).buffer;
  const key = await cryptoSource.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  let counter = 0n;
  const counterBytes = new Uint8Array(8);
  const counterView = new DataView(counterBytes.buffer);
  counterView.setBigUint64(0, counter, false);
  const deterministicRandomBytes = async (length) => {
    if (!Number.isFinite(length) || length < 0) {
      throw new RangeError("length must be a non-negative finite number");
    }
    const buffer = new Uint8Array(length);
    let offset = 0;
    while (offset < length) {
      counterView.setBigUint64(0, counter, false);
      counter += 1n;
      const block = new Uint8Array(await cryptoSource.subtle.sign("HMAC", key, counterBytes));
      const take = Math.min(block.length, length - offset);
      buffer.set(block.subarray(0, take), offset);
      offset += take;
    }
    return buffer;
  };
  return deterministicRandomBytes;
}, randomInt = async (min, max, randomBytes = getRandomBytes) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError("min and max must be finite numbers");
  }
  if (max <= min) {
    throw new RangeError("max must be greater than min");
  }
  const range = max - min;
  if (range === 1) {
    return min;
  }
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = 256 ** bytesNeeded;
  const limit = maxValue - maxValue % range;
  let value = limit;
  while (value >= limit) {
    const bytes = await randomBytes(bytesNeeded);
    value = 0;
    for (const byte of bytes) {
      value = value * 256 + byte;
    }
  }
  return min + value % range;
};
var init_random = __esm(() => {
  crypto = globalThis.crypto;
});

// src/index.ts
var exports_src = {};
__export(exports_src, {
  generatePasswordWithOptions: () => generatePasswordWithOptions,
  generatePassword: () => generatePassword
});
var VOWELS = "aeiou", CONSONANTS = "bcdfghjklmnpqrstvwxyz", VOWEL, CONSONANT, DEFAULT_PATTERN, DEFAULT_LENGTH = 12, MIN_ENTROPY_BITS = 64, MIN_WORD_LENGTH = 3, MAX_WORD_LENGTH = 7, textEncoder, normalizeOptions = (options) => {
  const lengthRaw = options?.length;
  const memorableRaw = options?.memorable;
  const patternRaw = options?.pattern;
  const prefixRaw = options?.prefix;
  const ignoreSecurityRecommendationsRaw = options?.ignoreSecurityRecommendations;
  const entropyRaw = options?.entropy;
  const wordsRaw = options?.words;
  const length = lengthRaw ?? DEFAULT_LENGTH;
  const memorable = memorableRaw ?? false;
  const pattern = patternRaw ?? DEFAULT_PATTERN;
  const prefix = prefixRaw ?? "";
  return {
    length,
    memorable,
    pattern,
    prefix: String(prefix),
    ignoreSecurityRecommendations: ignoreSecurityRecommendationsRaw ?? false,
    entropy: entropyRaw,
    words: wordsRaw
  };
}, ensureSafeInteger = (value, name) => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
}, ensureRegExp = (value) => {
  if (!(value instanceof RegExp)) {
    throw new TypeError("pattern must be a RegExp");
  }
}, normalizeEntropy = (entropy) => {
  if (entropy === undefined) {
    return;
  }
  if (typeof entropy === "string") {
    return textEncoder.encode(entropy);
  }
  if (entropy instanceof Uint8Array) {
    return entropy;
  }
  throw new TypeError("entropy must be a Uint8Array or string");
}, matchesPattern = (pattern, char) => {
  pattern.lastIndex = 0;
  return pattern.test(char);
}, buildValidChars = (pattern) => {
  const validChars = [];
  for (let i = 33;i <= 126; i += 1) {
    const char = String.fromCharCode(i);
    if (matchesPattern(pattern, char)) {
      validChars.push(char);
    }
  }
  if (validChars.length === 0) {
    throw new Error(`Could not find characters that match the password pattern ${pattern}. Patterns must match individual characters, not the password as a whole.`);
  }
  return validChars;
}, estimatePatternEntropy = (alphabetSize, length, prefix) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  const bitsPerChar = alphabetSize > 1 ? Math.log2(alphabetSize) : 0;
  const entropyBits = bitsPerChar * effectiveLength;
  const recommendedLength = bitsPerChar > 0 ? prefix.length + Math.ceil(MIN_ENTROPY_BITS / bitsPerChar) : null;
  return {
    effectiveLength,
    entropyBits,
    recommendedLength
  };
}, estimateMemorableEntropy = (length, prefix) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  let entropyBits = 0;
  let expectsVowel = CONSONANT.test(prefix);
  for (let i = 0;i < effectiveLength; i += 1) {
    const alphabetSize = expectsVowel ? VOWELS.length : CONSONANTS.length;
    entropyBits += Math.log2(alphabetSize);
    expectsVowel = !expectsVowel;
  }
  let recommendedLength = prefix.length;
  let recommendationBits = 0;
  expectsVowel = CONSONANT.test(prefix);
  while (recommendationBits < MIN_ENTROPY_BITS) {
    const alphabetSize = expectsVowel ? VOWELS.length : CONSONANTS.length;
    recommendationBits += Math.log2(alphabetSize);
    expectsVowel = !expectsVowel;
    recommendedLength += 1;
  }
  return {
    effectiveLength,
    entropyBits,
    recommendedLength
  };
}, MEMORABLE_RECOMMENDED_LENGTH, buildMemorableWord = async (length, nextInt) => {
  let expectsVowel = false;
  let word = "";
  for (let i = 0;i < length; i += 1) {
    const alphabet = expectsVowel ? VOWELS : CONSONANTS;
    const index = await nextInt(0, alphabet.length);
    word += alphabet[index] ?? "";
    expectsVowel = !expectsVowel;
  }
  return word;
}, buildWordLengths = async (count, nextInt, targetLength) => {
  const lengths = [];
  let total = 0;
  for (let i = 0;i < count; i += 1) {
    const length = await nextInt(MIN_WORD_LENGTH, MAX_WORD_LENGTH + 1);
    lengths.push(length);
    total += length;
  }
  if (targetLength !== undefined && total < targetLength) {
    const adjustable = Array.from({ length: count }, (_, idx) => idx);
    let remaining = targetLength - total;
    while (remaining > 0 && adjustable.length > 0) {
      const pickIndex = await nextInt(0, adjustable.length);
      const wordIndex = adjustable[pickIndex];
      if (wordIndex === undefined) {
        break;
      }
      const currentLength = lengths[wordIndex];
      if (currentLength === undefined) {
        break;
      }
      if (currentLength < MAX_WORD_LENGTH) {
        lengths[wordIndex] = currentLength + 1;
        remaining -= 1;
        if (lengths[wordIndex] === MAX_WORD_LENGTH) {
          adjustable.splice(pickIndex, 1);
        }
      } else {
        adjustable.splice(pickIndex, 1);
      }
    }
  }
  return lengths;
}, securityRecommendation = (reason, recommendation) => {
  throw new Error(`Security recommendation: ${reason}. ${recommendation} To override, pass { ignoreSecurityRecommendations: true }.`);
}, generatePassword = async (length, memorable, pattern, prefix) => {
  const options = {};
  if (length !== undefined) {
    options.length = length;
  }
  if (memorable !== undefined) {
    options.memorable = memorable;
  }
  if (pattern !== undefined) {
    options.pattern = pattern;
  }
  if (prefix !== undefined) {
    options.prefix = prefix;
  }
  return generatePasswordWithOptions(Object.keys(options).length ? options : undefined);
}, generatePasswordWithOptions = async (options) => {
  const {
    length,
    memorable,
    pattern,
    prefix,
    ignoreSecurityRecommendations,
    entropy,
    words
  } = normalizeOptions(options);
  ensureSafeInteger(length, "length");
  if (length < 0) {
    throw new RangeError("length must be a non-negative integer");
  }
  ensureRegExp(pattern);
  if (words !== undefined) {
    ensureSafeInteger(words, "words");
    if (words <= 0) {
      throw new RangeError("words must be a positive integer");
    }
  }
  if (words !== undefined && prefix !== "") {
    throw new Error("prefix is not supported when words are enabled");
  }
  const entropyBytes = normalizeEntropy(entropy);
  const randomBytes = entropyBytes ? await createDeterministicRandomBytes(entropyBytes) : getRandomBytes;
  const nextInt = (min, max) => randomInt(min, max, randomBytes);
  if (words !== undefined) {
    if (!ignoreSecurityRecommendations && words * MAX_WORD_LENGTH < MEMORABLE_RECOMMENDED_LENGTH) {
      const recommendedWords = Math.ceil(MEMORABLE_RECOMMENDED_LENGTH / MAX_WORD_LENGTH);
      securityRecommendation(`word count ${words} cannot reach ${MIN_ENTROPY_BITS} bits with ${MIN_WORD_LENGTH}-${MAX_WORD_LENGTH} letter words`, `Use words >= ${recommendedWords}.`);
    }
    const targetLength = ignoreSecurityRecommendations ? undefined : MEMORABLE_RECOMMENDED_LENGTH;
    const lengths = await buildWordLengths(words, nextInt, targetLength);
    const wordsList = [];
    for (const wordLength of lengths) {
      wordsList.push(await buildMemorableWord(wordLength, nextInt));
    }
    return wordsList.join(" ");
  }
  let currentPattern = pattern;
  let result = prefix;
  let validChars = null;
  if (!memorable) {
    validChars = buildValidChars(pattern);
  }
  if (!ignoreSecurityRecommendations) {
    if (memorable) {
      const estimate = estimateMemorableEntropy(length, prefix);
      if (estimate.entropyBits < MIN_ENTROPY_BITS) {
        securityRecommendation(`estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits`, `Use length >= ${estimate.recommendedLength} or set memorable: false.`);
      }
    } else if (validChars) {
      const estimate = estimatePatternEntropy(validChars.length, length, prefix);
      if (estimate.entropyBits < MIN_ENTROPY_BITS) {
        const recommendation = estimate.recommendedLength === null ? "Use a broader pattern to increase the character set." : `Use length >= ${estimate.recommendedLength} or broaden the pattern.`;
        securityRecommendation(`estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits`, recommendation);
      }
    }
  }
  while (result.length < length) {
    let char = "";
    if (memorable) {
      currentPattern = result.match(CONSONANT) ? VOWEL : CONSONANT;
      const code = await nextInt(33, 126);
      char = String.fromCharCode(code).toLowerCase();
    } else if (validChars) {
      const index = await nextInt(0, validChars.length);
      char = validChars[index] ?? "";
    }
    if (char.match(currentPattern)) {
      result += char;
    }
  }
  return result;
};
var init_src = __esm(() => {
  init_random();
  VOWEL = new RegExp(`[${VOWELS}]$`, "i");
  CONSONANT = new RegExp(`[${CONSONANTS}]$`, "i");
  DEFAULT_PATTERN = /\w/;
  textEncoder = new TextEncoder;
  MEMORABLE_RECOMMENDED_LENGTH = estimateMemorableEntropy(0, "").recommendedLength;
});

// src/cli.ts
var parseArgs = (args) => {
  const parsed = { _: [] };
  const set = (key, value = true) => {
    parsed[key] = value;
  };
  for (let i = 0;i < args.length; i += 1) {
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
var pickValue = (args, keys) => {
  for (const key of keys) {
    if (args[key] !== undefined) {
      return args[key];
    }
  }
  return;
};
var asBoolean = (value) => {
  if (value === undefined)
    return false;
  if (value === true)
    return true;
  if (Array.isArray(value))
    return value.length > 0;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized !== "false" && normalized !== "0";
  }
  return Boolean(value);
};
var asString = (value) => {
  if (value === undefined)
    return;
  if (Array.isArray(value))
    return value[0];
  return typeof value === "string" ? value : String(value);
};
var puts = console.log;
var DEFAULT_LENGTH2 = 16;
var DEFAULT_MEMORABLE_LENGTH = 20;
var DEFAULT_WORDS = 3;
var options = [
  {
    flags: "-l, --length <n>",
    description: `Password length [default: ${DEFAULT_LENGTH2}, or ${DEFAULT_MEMORABLE_LENGTH} with --memorable]`
  },
  { flags: "-m, --memorable", description: "Generates a memorable password" },
  {
    flags: "-c, --non-memorable",
    description: "Generates a non memorable password [default]"
  },
  {
    flags: "-p, --pattern <regex>",
    description: "Pattern to match for the generated password"
  },
  {
    flags: "-i, --ignore-security-recommendations",
    description: "Ignore security recommendations"
  },
  {
    flags: "-s, -sN, --words <n>",
    description: "Generate N memorable words (3-7 letters) separated by spaces [default: 3]"
  },
  { flags: "-h, --help", description: "Displays this help" }
];
var showHelp = () => {
  puts(`Generates a secure password\r
`);
  puts("Options:");
  for (const option of options) {
    puts(`  ${option.flags}: ${option.description}`);
  }
};
var runCli = async (argv = process.argv.slice(2)) => {
  const parsed = parseArgs(argv);
  const help = asBoolean(pickValue(parsed, ["h", "help"]));
  if (help) {
    showHelp();
    return;
  }
  const { generatePasswordWithOptions: generatePasswordWithOptions2 } = await Promise.resolve().then(() => (init_src(), exports_src));
  const patternRaw = asString(pickValue(parsed, ["p", "pattern"]));
  const suffixedWordsKey = Object.keys(parsed).find((key) => /^s\d+$/.test(key));
  const wordsRaw = pickValue(parsed, ["s", "words", "phrase", "passphrase"]);
  let words;
  if (suffixedWordsKey) {
    words = Number(suffixedWordsKey.slice(1));
  } else if (wordsRaw !== undefined) {
    words = wordsRaw === true ? DEFAULT_WORDS : Number(wordsRaw);
  }
  const hasMemorable = pickValue(parsed, ["m", "memorable"]) !== undefined;
  const hasNonMemorable = pickValue(parsed, ["c", "non-memorable", "nonmemorable"]) !== undefined;
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
  const length = lengthValue !== undefined ? lengthValue : words !== undefined ? undefined : memorable ? DEFAULT_MEMORABLE_LENGTH : DEFAULT_LENGTH2;
  const ignoreSecurityRecommendations = asBoolean(pickValue(parsed, [
    "i",
    "ignore-security-recommendations",
    "ignoreSecurityRecommendations"
  ]));
  const options2 = {
    memorable,
    ignoreSecurityRecommendations
  };
  if (pattern) {
    options2.pattern = pattern;
  }
  if (typeof length === "number" && Number.isFinite(length)) {
    options2.length = length;
  }
  if (words !== undefined) {
    options2.words = words;
  }
  const pass = await generatePasswordWithOptions2(options2);
  puts(pass);
};
export {
  runCli
};

//# debugId=164708593EC1153464756E2164756E21
//# sourceMappingURL=cli.js.map
