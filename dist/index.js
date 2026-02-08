// src/random.ts
var crypto = globalThis.crypto;
var MAX_RANDOM_BYTES = 65536;
var getRandomBytes = async (length) => {
  if (!Number.isFinite(length) || length < 0) {
    throw new RangeError("length must be a non-negative finite number");
  }
  const buffer = new Uint8Array(length);
  for (let offset = 0;offset < length; offset += MAX_RANDOM_BYTES) {
    const end = Math.min(offset + MAX_RANDOM_BYTES, length);
    crypto.getRandomValues(buffer.subarray(offset, end));
  }
  return buffer;
};
var createDeterministicRandomBytes = async (entropy, cryptoSource = crypto) => {
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
};
var randomInt = async (min, max, randomBytes = getRandomBytes) => {
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

// src/index.ts
var VOWELS = "aeiou";
var CONSONANTS = "bcdfghjklmnpqrstvwxyz";
var VOWEL = new RegExp(`[${VOWELS}]$`, "i");
var CONSONANT = new RegExp(`[${CONSONANTS}]$`, "i");
var DEFAULT_PATTERN = /\w/;
var DEFAULT_LENGTH = 12;
var MIN_ENTROPY_BITS = 64;
var MIN_WORD_LENGTH = 3;
var MAX_WORD_LENGTH = 7;
var textEncoder = new TextEncoder;
var normalizeOptions = (options) => {
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
};
var ensureSafeInteger = (value, name) => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
};
var ensureRegExp = (value) => {
  if (!(value instanceof RegExp)) {
    throw new TypeError("pattern must be a RegExp");
  }
};
var normalizeEntropy = (entropy) => {
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
};
var matchesPattern = (pattern, char) => {
  pattern.lastIndex = 0;
  return pattern.test(char);
};
var buildValidChars = (pattern) => {
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
};
var estimatePatternEntropy = (alphabetSize, length, prefix) => {
  const effectiveLength = Math.max(0, length - prefix.length);
  const bitsPerChar = alphabetSize > 1 ? Math.log2(alphabetSize) : 0;
  const entropyBits = bitsPerChar * effectiveLength;
  const recommendedLength = bitsPerChar > 0 ? prefix.length + Math.ceil(MIN_ENTROPY_BITS / bitsPerChar) : null;
  return {
    effectiveLength,
    entropyBits,
    recommendedLength
  };
};
var estimateMemorableEntropy = (length, prefix) => {
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
};
var MEMORABLE_RECOMMENDED_LENGTH = estimateMemorableEntropy(0, "").recommendedLength;
var buildMemorableWord = async (length, nextInt) => {
  let expectsVowel = false;
  let word = "";
  for (let i = 0;i < length; i += 1) {
    const alphabet = expectsVowel ? VOWELS : CONSONANTS;
    const index = await nextInt(0, alphabet.length);
    word += alphabet[index] ?? "";
    expectsVowel = !expectsVowel;
  }
  return word;
};
var buildWordLengths = async (count, nextInt, targetLength) => {
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
};
var securityRecommendation = (reason, recommendation) => {
  throw new Error(`Security recommendation: ${reason}. ${recommendation} To override, pass { ignoreSecurityRecommendations: true }.`);
};
var generatePassword = async (length, memorable, pattern, prefix) => {
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
};
var generatePasswordWithOptions = async (options) => {
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
export {
  generatePasswordWithOptions,
  generatePassword
};

//# debugId=590DE33B76F9D4FC64756E2164756E21
//# sourceMappingURL=index.js.map
