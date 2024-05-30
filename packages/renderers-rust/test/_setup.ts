import { expect } from 'vitest';

export function codeContains(actual: string, expected: (RegExp | string)[] | RegExp | string) {
    const expectedArray = Array.isArray(expected) ? expected : [expected];
    expectedArray.forEach(e => {
        if (typeof e === 'string') {
            expect(actual).toContain(e);
        } else {
            expect(actual).toMatch(e);
        }
    });
}

export function codeDoesNotContains(actual: string, expected: (RegExp | string)[] | RegExp | string) {
    const expectedArray = Array.isArray(expected) ? expected : [expected];
    expectedArray.forEach(e => {
        if (typeof e === 'string') {
            expect(actual).not.toContain(e);
        } else {
            expect(actual).not.toMatch(e);
        }
    });
}
