import { describe, it, expect } from "bun:test";
import { generatePassword, generatePasswordWithOptions } from "../src/index.ts";
import {
  createDeterministicRandomBytes,
  getRandomBytes,
  randomInt,
} from "../src/random.ts";

describe("Password generator", () => {
  it("generates a 12 character non-memorable password by default", async () => {
    const pass = await generatePassword();
    expect(pass).toMatch(/^\w{12}$/);
  });

  it("generates a 20 character memorable password", async () => {
    const pass = await generatePassword(20, true);
    expect(pass).toMatch(/([bcdfghjklmnpqrstvwxyz][aeiou]){10}/);
  });

  it("allows memorable passwords with ignoreSecurityRecommendations", async () => {
    const pass = await generatePasswordWithOptions({
      length: 10,
      memorable: true,
      ignoreSecurityRecommendations: true,
    });
    expect(pass).toMatch(/([bcdfghjklmnpqrstvwxyz][aeiou]){5}/);
  });

  it("generates a 1000 character non memorable password", async () => {
    const pass = await generatePassword(1000, false);
    expect(pass).toMatch(/^\w{1000}$/);
    expect(pass.length).toBe(1000);
  });

  it("generates non memorable passwords using the default pattern", async () => {
    const pass = await generatePassword(12, false);
    expect(pass).toMatch(/^\w{12}$/);
  });

  it("generates passwords matching regex pattern", async () => {
    const pass = await generatePasswordWithOptions({
      length: 5,
      memorable: false,
      pattern: /\d/,
      ignoreSecurityRecommendations: true,
    });
    expect(pass).toMatch(/^\d{5}$/);
  });

  it("generates passwords with a given prefix", async () => {
    const pass = await generatePasswordWithOptions({
      length: 7,
      memorable: false,
      pattern: /\d/,
      prefix: "foo-",
      ignoreSecurityRecommendations: true,
    });
    expect(pass).toMatch(/^foo-\d{3}$/);
  });

  it("supports positional prefix arguments", async () => {
    const pass = await generatePassword(20, false, /\w/, "pre-");
    expect(pass.startsWith("pre-")).toBe(true);
    expect(pass.length).toBe(20);
  });

  it("keeps prefixes longer than the requested length", async () => {
    const pass = await generatePasswordWithOptions({
      length: 3,
      memorable: false,
      pattern: /\d/,
      prefix: "prefix-",
      ignoreSecurityRecommendations: true,
    });
    expect(pass).toBe("prefix-");
  });

  it("generates long passwords without call stack issues", async () => {
    const pass = await generatePassword(1200, false, /\d/);
    expect(pass).toMatch(/^\d{1200}$/);
  });

  it("generates passwords with a short pattern", async () => {
    const pass = await generatePasswordWithOptions({
      length: 11,
      memorable: false,
      pattern: /(t|e|s|t)/,
      ignoreSecurityRecommendations: true,
    });
    expect(pass.length).toBe(11);
    expect(pass).toMatch(/(t|e|s|t)/);
  });

  it("ignores custom pattern when memorable is true", async () => {
    const pass = await generatePassword(20, true, /\d/);
    expect(pass).toMatch(/([bcdfghjklmnpqrstvwxyz][aeiou]){10}/);
  });

  it("prevents using invalid patterns", async () => {
    await expect(generatePassword(11, false, /test/)).rejects.toThrow(
      /Could not find characters that match the password pattern/,
    );
  });

  it("includes the lower ASCII characters issue #25", async () => {
    const pass = await generatePassword(100, false, /[Aa]/);
    expect(pass.length).toBe(100);
    expect(pass).toMatch(/A/);
    expect(pass).toMatch(/a/);
  });

  it("allows ~ character", async () => {
    const pass = await generatePasswordWithOptions({
      length: 2,
      memorable: false,
      pattern: /[~]/,
      ignoreSecurityRecommendations: true,
    });
    expect(pass.length).toBe(2);
    expect(pass).toBe("~~");
  });

  it("supports generatePasswordWithOptions", async () => {
    const pass = await generatePasswordWithOptions({
      length: 8,
      memorable: false,
      pattern: /[A-Z]/,
      prefix: "X-",
      ignoreSecurityRecommendations: true,
    });
    expect(pass).toMatch(/^X-[A-Z]{6}$/);
  });

  it("supports generatePasswordWithOptions defaults", async () => {
    const pass = await generatePasswordWithOptions();
    expect(pass).toMatch(/^\w{12}$/);
  });

  it("generates passphrases with 3 words by default", async () => {
    const pass = await generatePasswordWithOptions({ words: 3 });
    const words = pass.split(" ");
    expect(words).toHaveLength(3);
    for (const word of words) {
      expect(word).toMatch(/^[a-z]{3,7}$/);
    }
  });

  it("generates passphrases with the requested word count", async () => {
    const pass = await generatePasswordWithOptions({ words: 5 });
    const words = pass.split(" ");
    expect(words).toHaveLength(5);
  });

  it("rejects passphrases with too few words without override", async () => {
    await expect(generatePasswordWithOptions({ words: 2 })).rejects.toThrow(
      /ignoreSecurityRecommendations/,
    );
  });

  it("allows short passphrases with ignoreSecurityRecommendations", async () => {
    const pass = await generatePasswordWithOptions({
      words: 2,
      ignoreSecurityRecommendations: true,
    });
    const words = pass.split(" ");
    expect(words).toHaveLength(2);
  });

  it("rejects invalid word counts", async () => {
    await expect(generatePasswordWithOptions({ words: 0 })).rejects.toThrow(
      RangeError,
    );
    await expect(generatePasswordWithOptions({ words: 2.5 })).rejects.toThrow(
      RangeError,
    );
  });

  it("rejects passphrases with prefix", async () => {
    await expect(
      generatePasswordWithOptions({ words: 3, prefix: "pre-" }),
    ).rejects.toThrow(/prefix/);
  });

  it("rejects insecure non-memorable settings without override", async () => {
    await expect(
      generatePasswordWithOptions({
        length: 8,
        memorable: false,
        pattern: /\d/,
      }),
    ).rejects.toThrow(/ignoreSecurityRecommendations/);
  });

  it("rejects insecure memorable settings without override", async () => {
    await expect(
      generatePasswordWithOptions({ length: 10, memorable: true }),
    ).rejects.toThrow(/ignoreSecurityRecommendations/);
  });

  it("supports deterministic entropy", async () => {
    const options = {
      length: 16,
      memorable: false,
      entropy: "deterministic-seed",
    };
    const pass1 = await generatePasswordWithOptions(options);
    const pass2 = await generatePasswordWithOptions(options);
    expect(pass1).toBe(pass2);
  });

  it("supports deterministic entropy from bytes", async () => {
    const options = {
      length: 16,
      memorable: false,
      entropy: new Uint8Array([1, 2, 3, 4]),
    };
    const pass1 = await generatePasswordWithOptions(options);
    const pass2 = await generatePasswordWithOptions(options);
    expect(pass1).toBe(pass2);
  });

  it("produces deterministic byte streams", async () => {
    const randomBytes = await createDeterministicRandomBytes(
      new Uint8Array([9, 8, 7]),
    );
    const bytes = await randomBytes(32);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });

  it("rejects non-integer lengths", async () => {
    await expect(
      generatePasswordWithOptions({ length: 10.5, memorable: false }),
    ).rejects.toThrow(RangeError);
  });

  it("rejects invalid pattern types", async () => {
    await expect(
      generatePasswordWithOptions({
        length: 12,
        memorable: false,
        // @ts-expect-error - runtime validation
        pattern: "[a-z]",
      }),
    ).rejects.toThrow(TypeError);
  });

  it("rejects invalid entropy types", async () => {
    await expect(
      generatePasswordWithOptions({
        length: 12,
        memorable: false,
        // @ts-expect-error - runtime validation
        entropy: 123,
      }),
    ).rejects.toThrow(TypeError);
  });

  it("throws on invalid random byte length", async () => {
    await expect(getRandomBytes(-1)).rejects.toThrow(RangeError);
  });

  it("rejects empty entropy seeds", async () => {
    await expect(
      createDeterministicRandomBytes(new Uint8Array()),
    ).rejects.toThrow(RangeError);
  });

  it("rejects deterministic entropy without subtle crypto", async () => {
    await expect(
      createDeterministicRandomBytes(new Uint8Array([1]), {
        getRandomValues: (value) => value,
        subtle: undefined,
      }),
    ).rejects.toThrow(/WebCrypto subtle/);
  });

  it("supports large random byte requests", async () => {
    const bytes = await getRandomBytes(70_000);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(70_000);
  });

  it("throws when randomInt bounds are not finite", async () => {
    await expect(randomInt(Number.NaN, 10)).rejects.toThrow(RangeError);
    await expect(randomInt(0, Number.POSITIVE_INFINITY)).rejects.toThrow(
      RangeError,
    );
  });

  it("throws when randomInt max is not greater than min", async () => {
    await expect(randomInt(5, 5)).rejects.toThrow(RangeError);
    await expect(randomInt(6, 5)).rejects.toThrow(RangeError);
  });

  it("returns min when randomInt range is 1", async () => {
    await expect(randomInt(5, 6)).resolves.toBe(5);
  });

  it("supports zero-length random bytes", async () => {
    const bytes = await getRandomBytes(0);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(0);
  });
});
