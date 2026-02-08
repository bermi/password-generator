type RandomBytes = (length: number) => Promise<Uint8Array>;
type CryptoSource = Pick<Crypto, "getRandomValues" | "subtle">;
export declare const getRandomBytes: RandomBytes;
export declare const createDeterministicRandomBytes: (entropy: Uint8Array, cryptoSource?: CryptoSource) => Promise<RandomBytes>;
export declare const randomInt: (min: number, max: number, randomBytes?: RandomBytes) => Promise<number>;
export {};
//# sourceMappingURL=random.d.ts.map