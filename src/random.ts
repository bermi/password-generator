const crypto = globalThis.crypto!;
const MAX_RANDOM_BYTES = 65_536;

type RandomBytes = (length: number) => Promise<Uint8Array>;
type CryptoSource = Pick<Crypto, "getRandomValues" | "subtle">;

export const getRandomBytes: RandomBytes = async (
  length: number,
): Promise<Uint8Array> => {
  if (!Number.isFinite(length) || length < 0) {
    throw new RangeError("length must be a non-negative finite number");
  }

  const buffer = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += MAX_RANDOM_BYTES) {
    const end = Math.min(offset + MAX_RANDOM_BYTES, length);
    crypto.getRandomValues(buffer.subarray(offset, end));
  }
  return buffer;
};

export const createDeterministicRandomBytes = async (
  entropy: Uint8Array,
  cryptoSource: CryptoSource = crypto,
): Promise<RandomBytes> => {
  if (entropy.length === 0) {
    throw new RangeError("entropy must not be empty");
  }
  if (!cryptoSource.subtle) {
    throw new Error("WebCrypto subtle is required for deterministic entropy");
  }

  const keyData = new Uint8Array(entropy).buffer;
  const key = await cryptoSource.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  let counter = 0n;
  const counterBytes = new Uint8Array(8);
  const counterView = new DataView(counterBytes.buffer);
  const deterministicRandomBytes: RandomBytes = async (length: number) => {
    if (!Number.isFinite(length) || length < 0) {
      throw new RangeError("length must be a non-negative finite number");
    }

    const buffer = new Uint8Array(length);
    let offset = 0;

    while (offset < length) {
      counterView.setBigUint64(0, counter, false);
      counter += 1n;
      const block = new Uint8Array(
        await cryptoSource.subtle.sign("HMAC", key, counterBytes),
      );
      const take = Math.min(block.length, length - offset);
      buffer.set(block.subarray(0, take), offset);
      offset += take;
    }

    return buffer;
  };

  return deterministicRandomBytes;
};

export const randomInt = async (
  min: number,
  max: number,
  randomBytes: RandomBytes = getRandomBytes,
): Promise<number> => {
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
  const limit = maxValue - (maxValue % range);

  let value = limit;
  while (value >= limit) {
    const bytes = await randomBytes(bytesNeeded);
    value = 0;
    for (const byte of bytes) {
      value = value * 256 + byte;
    }
  }

  return min + (value % range);
};
