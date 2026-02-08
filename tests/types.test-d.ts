import {
  generatePassword,
  generatePasswordWithOptions,
  type GenerateOptions,
} from "../src/index";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type _assertReturn = Expect<
  Equal<ReturnType<typeof generatePassword>, Promise<string>>
>;

type _assertOptions = Expect<
  Equal<
    GenerateOptions,
    {
      length?: number;
      memorable?: boolean;
      pattern?: RegExp;
      prefix?: string;
      ignoreSecurityRecommendations?: boolean;
      entropy?: Uint8Array | string;
      words?: number;
    }
  >
>;

const options: GenerateOptions = {
  length: 12,
  memorable: false,
  pattern: /\d/,
  prefix: "foo-",
  ignoreSecurityRecommendations: true,
  entropy: new Uint8Array([1, 2, 3]),
  words: 3,
};

const stringEntropy: GenerateOptions = {
  entropy: "seed",
};

const promise: Promise<string> = generatePasswordWithOptions(options);
const promise2: Promise<string> = generatePassword(12, false, /[a-z]/, "bar-");

void promise;
void promise2;
void stringEntropy;

// @ts-expect-error - length must be a number
const badOptions: GenerateOptions = { length: "12" };

// @ts-expect-error - pattern must be a RegExp
const badOptions2: GenerateOptions = { pattern: "[a-z]" };

// @ts-expect-error - ignoreSecurityRecommendations must be boolean
const badOptions3: GenerateOptions = { ignoreSecurityRecommendations: "yes" };

// @ts-expect-error - entropy must be Uint8Array or string
const badOptions4: GenerateOptions = { entropy: 123 };

void badOptions;
void badOptions2;
void badOptions3;
void badOptions4;
