import type { ExecutionContext } from 'ava';

export function codeContains(t: ExecutionContext, actual: string, expected: RegExp | RegExp[] | string[] | string) {
    const expectedArray = Array.isArray(expected) ? expected : [expected];
    expectedArray.forEach(e => {
        t.true(
            typeof e === 'string' ? actual.includes(e) : e.test(actual),
            `The following expected code is missing from the actual content:\n` +
                `${e}\n\n` +
                `Actual content:\n` +
                `${actual}`,
        );
    });
}
