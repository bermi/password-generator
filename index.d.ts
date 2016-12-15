// Usage: import * as generatePassword from 'password-generator';
// generatePassword();

declare namespace generatePassword {
}

declare function generatePassword(length?: number, memorable?: boolean, pattern?: RegExp, prefix?: string): string;

export = generatePassword;
