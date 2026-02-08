export type GenerateOptions = {
    length?: number;
    memorable?: boolean;
    pattern?: RegExp;
    prefix?: string;
    ignoreSecurityRecommendations?: boolean;
    entropy?: Uint8Array | string;
    words?: number;
};
export declare const generatePassword: (length?: number, memorable?: boolean, pattern?: RegExp, prefix?: string) => Promise<string>;
export declare const generatePasswordWithOptions: (options?: GenerateOptions) => Promise<string>;
//# sourceMappingURL=index.d.ts.map