import {
  createDeterministicRandomBytes,
  getRandomBytes,
  randomInt,
} from "./random.js";

export type GenerateOptions = {
  length?: number;
  memorable?: boolean;
  pattern?: RegExp;
  prefix?: string;
  ignoreSecurityRecommendations?: boolean;
  entropy?: Uint8Array | string;
  words?: number;
};

const VOWELS = "aeiou";
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const VOWEL = new RegExp(`[${VOWELS}]$`, "i");
const CONSONANT = new RegExp(`[${CONSONANTS}]$`, "i");
const DEFAULT_PATTERN = /\w/;
const DEFAULT_LENGTH = 12;
const MIN_ENTROPY_BITS = 64;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 7;
const textEncoder = new TextEncoder();

const normalizeOptions = (options: GenerateOptions | undefined) => {
  const lengthRaw = options?.length;
  const memorableRaw = options?.memorable;
  const patternRaw = options?.pattern;
  const prefixRaw = options?.prefix;
  const ignoreSecurityRecommendationsRaw =
    options?.ignoreSecurityRecommendations;
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
    words: wordsRaw,
  };
};

const ensureSafeInteger = (value: number, name: string) => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
};

const ensureRegExp = (value: unknown) => {
  if (!(value instanceof RegExp)) {
    throw new TypeError("pattern must be a RegExp");
  }
};

const normalizeEntropy = (entropy: Uint8Array | string | undefined) => {
  if (entropy === undefined) {
    return undefined;
  }
  if (typeof entropy === "string") {
    return textEncoder.encode(entropy);
  }
  if (entropy instanceof Uint8Array) {
    return entropy;
  }
  throw new TypeError("entropy must be a Uint8Array or string");
};

const matchesPattern = (pattern: RegExp, char: string) => {
  pattern.lastIndex = 0;
  return pattern.test(char);
};

const buildValidChars = (pattern: RegExp) => {
  const validChars: string[] = [];
  for (let i = 33; i <= 126; i += 1) {
    const char = String.fromCharCode(i);
    if (matchesPattern(pattern, char)) {
      validChars.push(char);
    }
  }
  if (validChars.length === 0) {
    throw new Error(
      `Could not find characters that match the password pattern ${pattern}. Patterns must match individual characters, not the password as a whole.`,
    );
  }
  return validChars;
};

const estimatePatternEntropy = (
  alphabetSize: number,
  length: number,
  prefix: string,
) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  const bitsPerChar = alphabetSize > 1 ? Math.log2(alphabetSize) : 0;
  const entropyBits = bitsPerChar * effectiveLength;
  const recommendedLength =
    bitsPerChar > 0
      ? prefix.length + Math.ceil(MIN_ENTROPY_BITS / bitsPerChar)
      : null;

  return {
    effectiveLength,
    entropyBits,
    recommendedLength,
  };
};

const estimateMemorableEntropy = (length: number, prefix: string) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  let entropyBits = 0;
  let expectsVowel = CONSONANT.test(prefix);

  for (let i = 0; i < effectiveLength; i += 1) {
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
    recommendedLength,
  };
};

const MEMORABLE_RECOMMENDED_LENGTH = estimateMemorableEntropy(
  0,
  "",
).recommendedLength;

const buildMemorableWord = async (
  length: number,
  nextInt: (min: number, max: number) => Promise<number>,
) => {
  let expectsVowel = false;
  let word = "";

  for (let i = 0; i < length; i += 1) {
    const alphabet = expectsVowel ? VOWELS : CONSONANTS;
    const index = await nextInt(0, alphabet.length);
    word += alphabet[index] ?? "";
    expectsVowel = !expectsVowel;
  }

  return word;
};

const buildWordLengths = async (
  count: number,
  nextInt: (min: number, max: number) => Promise<number>,
  targetLength?: number,
) => {
  const lengths: number[] = [];
  let total = 0;

  for (let i = 0; i < count; i += 1) {
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
};

const securityRecommendation = (reason: string, recommendation: string) => {
  throw new Error(
    `Security recommendation: ${reason}. ${recommendation} To override, pass { ignoreSecurityRecommendations: true }.`,
  );
};

export const generatePassword = async (
  length?: number,
  memorable?: boolean,
  pattern?: RegExp,
  prefix?: string,
): Promise<string> => {
  const options: GenerateOptions = {};
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

  return generatePasswordWithOptions(
    Object.keys(options).length ? options : undefined,
  );
};

export const generatePasswordWithOptions = async (
  options?: GenerateOptions,
): Promise<string> => {
  const {
    length,
    memorable,
    pattern,
    prefix,
    ignoreSecurityRecommendations,
    entropy,
    words,
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
  const randomBytes = entropyBytes
    ? await createDeterministicRandomBytes(entropyBytes)
    : getRandomBytes;
  const nextInt = (min: number, max: number) =>
    randomInt(min, max, randomBytes);

  if (words !== undefined) {
    if (
      !ignoreSecurityRecommendations &&
      words * MAX_WORD_LENGTH < MEMORABLE_RECOMMENDED_LENGTH
    ) {
      const recommendedWords = Math.ceil(
        MEMORABLE_RECOMMENDED_LENGTH / MAX_WORD_LENGTH,
      );
      securityRecommendation(
        `word count ${words} cannot reach ${MIN_ENTROPY_BITS} bits with ${MIN_WORD_LENGTH}-${MAX_WORD_LENGTH} letter words`,
        `Use words >= ${recommendedWords}.`,
      );
    }

    const targetLength = ignoreSecurityRecommendations
      ? undefined
      : MEMORABLE_RECOMMENDED_LENGTH;
    const lengths = await buildWordLengths(words, nextInt, targetLength);
    const wordsList: string[] = [];

    for (const wordLength of lengths) {
      wordsList.push(await buildMemorableWord(wordLength, nextInt));
    }

    return wordsList.join(" ");
  }

  let currentPattern = pattern;
  let result = prefix;
  let validChars: string[] | null = null;

  if (!memorable) {
    validChars = buildValidChars(pattern);
  }

  if (!ignoreSecurityRecommendations) {
    if (memorable) {
      const estimate = estimateMemorableEntropy(length, prefix);
      if (estimate.entropyBits < MIN_ENTROPY_BITS) {
        securityRecommendation(
          `estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits`,
          `Use length >= ${estimate.recommendedLength} or set memorable: false.`,
        );
      }
    } else if (validChars) {
      const estimate = estimatePatternEntropy(
        validChars.length,
        length,
        prefix,
      );
      if (estimate.entropyBits < MIN_ENTROPY_BITS) {
        const recommendation =
          estimate.recommendedLength === null
            ? "Use a broader pattern to increase the character set."
            : `Use length >= ${estimate.recommendedLength} or broaden the pattern.`;
        securityRecommendation(
          `estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits`,
          recommendation,
        );
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
