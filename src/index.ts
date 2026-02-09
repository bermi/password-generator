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
const CONSONANT = new RegExp(`[${CONSONANTS}]$`, "i");
const DEFAULT_PATTERN = /\w/;
const DEFAULT_LENGTH = 12;
const MIN_ENTROPY_BITS = 64;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 7;
const textEncoder = new TextEncoder();

// Minimum memorable characters needed to reach MIN_ENTROPY_BITS.
const MIN_MEMORABLE_LENGTH = (() => {
  let bits = 0;
  let len = 0;
  let vowel = false;
  while (bits < MIN_ENTROPY_BITS) {
    bits += Math.log2(vowel ? VOWELS.length : CONSONANTS.length);
    vowel = !vowel;
    len += 1;
  }
  return len;
})();

const buildValidChars = (pattern: RegExp) => {
  const chars: string[] = [];
  for (let i = 33; i <= 126; i += 1) {
    const char = String.fromCharCode(i);
    if (pattern.test(char)) {
      chars.push(char);
    }
  }
  if (chars.length === 0) {
    throw new Error(
      `Could not find characters that match the password pattern ${pattern}. Patterns must match individual characters, not the password as a whole.`,
    );
  }
  return chars;
};

const estimatePatternEntropy = (
  alphabetSize: number,
  length: number,
  prefixLength: number,
) => {
  const bitsPerChar = alphabetSize > 1 ? Math.log2(alphabetSize) : 0;
  return {
    entropyBits: bitsPerChar * Math.max(0, length - prefixLength),
    recommendedLength:
      bitsPerChar > 0
        ? prefixLength + Math.ceil(MIN_ENTROPY_BITS / bitsPerChar)
        : null,
  };
};

const estimateMemorableEntropy = (length: number, prefix: string) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  let entropyBits = 0;
  let expectsVowel = CONSONANT.test(prefix);
  for (let i = 0; i < effectiveLength; i += 1) {
    entropyBits += Math.log2(expectsVowel ? VOWELS.length : CONSONANTS.length);
    expectsVowel = !expectsVowel;
  }

  let recommendedLength = prefix.length;
  let bits = 0;
  expectsVowel = CONSONANT.test(prefix);
  while (bits < MIN_ENTROPY_BITS) {
    bits += Math.log2(expectsVowel ? VOWELS.length : CONSONANTS.length);
    expectsVowel = !expectsVowel;
    recommendedLength += 1;
  }

  return { entropyBits, recommendedLength };
};

const buildMemorable = async (
  length: number,
  startsWithVowel: boolean,
  nextInt: (min: number, max: number) => Promise<number>,
) => {
  let expectsVowel = startsWithVowel;
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const alphabet = expectsVowel ? VOWELS : CONSONANTS;
    result += alphabet[await nextInt(0, alphabet.length)];
    expectsVowel = !expectsVowel;
  }
  return result;
};

const buildWordLengths = async (
  count: number,
  nextInt: (min: number, max: number) => Promise<number>,
  targetLength?: number,
) => {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const len = await nextInt(MIN_WORD_LENGTH, MAX_WORD_LENGTH + 1);
    lengths.push(len);
    total += len;
  }

  if (targetLength !== undefined && total < targetLength) {
    const adjustable: number[] = [];
    for (let i = 0; i < count; i += 1) {
      if (lengths[i]! < MAX_WORD_LENGTH) adjustable.push(i);
    }
    let remaining = targetLength - total;
    while (remaining > 0 && adjustable.length > 0) {
      const pick = await nextInt(0, adjustable.length);
      const wordIdx = adjustable[pick]!;
      lengths[wordIdx] = lengths[wordIdx]! + 1;
      remaining -= 1;
      if (lengths[wordIdx]! >= MAX_WORD_LENGTH) {
        adjustable.splice(pick, 1);
      }
    }
  }

  return lengths;
};

export const generatePassword = async (
  length?: number,
  memorable?: boolean,
  pattern?: RegExp,
  prefix?: string,
): Promise<string> => {
  const opts: GenerateOptions = {};
  if (length !== undefined) opts.length = length;
  if (memorable !== undefined) opts.memorable = memorable;
  if (pattern !== undefined) opts.pattern = pattern;
  if (prefix !== undefined) opts.prefix = prefix;
  return generatePasswordWithOptions(opts);
};

export const generatePasswordWithOptions = async (
  options?: GenerateOptions,
): Promise<string> => {
  const length = options?.length ?? DEFAULT_LENGTH;
  const memorable = options?.memorable ?? false;
  const pattern = options?.pattern ?? DEFAULT_PATTERN;
  const prefix = String(options?.prefix ?? "");
  const ignoreSecurityRecommendations =
    options?.ignoreSecurityRecommendations ?? false;
  const entropy = options?.entropy;
  const words = options?.words;

  if (!Number.isSafeInteger(length)) {
    throw new RangeError("length must be a safe integer");
  }
  if (length < 0) {
    throw new RangeError("length must be a non-negative integer");
  }
  if (!(pattern instanceof RegExp)) {
    throw new TypeError("pattern must be a RegExp");
  }
  if (words !== undefined) {
    if (!Number.isSafeInteger(words)) {
      throw new RangeError("words must be a safe integer");
    }
    if (words <= 0) {
      throw new RangeError("words must be a positive integer");
    }
  }
  if (words !== undefined && prefix !== "") {
    throw new Error("prefix is not supported when words are enabled");
  }

  let entropyBytes: Uint8Array | undefined;
  if (entropy !== undefined) {
    if (typeof entropy === "string") {
      entropyBytes = textEncoder.encode(entropy);
    } else if (entropy instanceof Uint8Array) {
      entropyBytes = entropy;
    } else {
      throw new TypeError("entropy must be a Uint8Array or string");
    }
  }

  const randomBytes = entropyBytes
    ? await createDeterministicRandomBytes(entropyBytes)
    : getRandomBytes;
  const nextInt = (min: number, max: number) =>
    randomInt(min, max, randomBytes);

  // Passphrase mode
  if (words !== undefined) {
    if (
      !ignoreSecurityRecommendations &&
      words * MAX_WORD_LENGTH < MIN_MEMORABLE_LENGTH
    ) {
      const recommendedWords = Math.ceil(
        MIN_MEMORABLE_LENGTH / MAX_WORD_LENGTH,
      );
      throw new Error(
        `Security recommendation: word count ${words} cannot reach ${MIN_ENTROPY_BITS} bits with ${MIN_WORD_LENGTH}-${MAX_WORD_LENGTH} letter words. Use words >= ${recommendedWords}. To override, pass { ignoreSecurityRecommendations: true }.`,
      );
    }

    const targetLength = ignoreSecurityRecommendations
      ? undefined
      : MIN_MEMORABLE_LENGTH;
    const lengths = await buildWordLengths(words, nextInt, targetLength);
    const wordsList: string[] = [];
    for (const wordLength of lengths) {
      wordsList.push(await buildMemorable(wordLength, false, nextInt));
    }
    return wordsList.join(" ");
  }

  // Memorable mode: direct alphabet indexing
  if (memorable) {
    if (!ignoreSecurityRecommendations) {
      const estimate = estimateMemorableEntropy(length, prefix);
      if (estimate.entropyBits < MIN_ENTROPY_BITS) {
        throw new Error(
          `Security recommendation: estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits. Use length >= ${estimate.recommendedLength} or set memorable: false. To override, pass { ignoreSecurityRecommendations: true }.`,
        );
      }
    }
    const charCount = Math.max(0, length - prefix.length);
    return (
      prefix + (await buildMemorable(charCount, CONSONANT.test(prefix), nextInt))
    );
  }

  // Pattern mode
  const validChars = buildValidChars(pattern);
  if (!ignoreSecurityRecommendations) {
    const estimate = estimatePatternEntropy(
      validChars.length,
      length,
      prefix.length,
    );
    if (estimate.entropyBits < MIN_ENTROPY_BITS) {
      const recommendation =
        estimate.recommendedLength === null
          ? "Use a broader pattern to increase the character set."
          : `Use length >= ${estimate.recommendedLength} or broaden the pattern.`;
      throw new Error(
        `Security recommendation: estimated entropy ${estimate.entropyBits.toFixed(1)} bits is below ${MIN_ENTROPY_BITS} bits. ${recommendation} To override, pass { ignoreSecurityRecommendations: true }.`,
      );
    }
  }

  let result = prefix;
  while (result.length < length) {
    result += validChars[await nextInt(0, validChars.length)];
  }
  return result;
};
