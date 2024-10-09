import { RenderMap } from '@codama/renderers-core';
import * as estreePlugin from 'prettier/plugins/estree';
import * as typeScriptPlugin from 'prettier/plugins/typescript';
import { format } from 'prettier/standalone';
import { expect } from 'vitest';

const PRETTIER_OPTIONS: Parameters<typeof format>[1] = {
    arrowParens: 'always',
    parser: 'typescript',
    plugins: [estreePlugin, typeScriptPlugin],
    printWidth: 80,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'none',
    useTabs: false,
};

export function renderMapContains(renderMap: RenderMap, key: string, expected: (RegExp | string)[] | RegExp | string) {
    expect(renderMap.has(key), `RenderMap is missing key "${key}".`).toBe(true);
    return codeContains(renderMap.get(key), expected);
}

export async function codeContains(actual: string, expected: (RegExp | string)[] | RegExp | string) {
    const expectedArray = Array.isArray(expected) ? expected : [expected];
    const normalizedActual = await normalizeCode(actual);
    expectedArray.forEach(expectedResult => {
        if (typeof expectedResult === 'string') {
            expect(normalizedActual).toMatch(codeStringAsRegex(expectedResult));
        } else {
            expect(normalizedActual).toMatch(expectedResult);
        }
    });
}

export async function codeDoesNotContain(actual: string, expected: (RegExp | string)[] | RegExp | string) {
    const expectedArray = Array.isArray(expected) ? expected : [expected];
    const normalizedActual = await normalizeCode(actual);
    expectedArray.forEach(expectedResult => {
        if (typeof expectedResult === 'string') {
            expect(normalizedActual).not.toMatch(codeStringAsRegex(expectedResult));
        } else {
            expect(normalizedActual).not.toMatch(expectedResult);
        }
    });
}

export function renderMapContainsImports(renderMap: RenderMap, key: string, expectedImports: Record<string, string[]>) {
    expect(renderMap.has(key), `RenderMap is missing key "${key}".`).toBe(true);
    return codeContainsImports(renderMap.get(key), expectedImports);
}

export async function codeContainsImports(actual: string, expectedImports: Record<string, string[]>) {
    const normalizedActual = await inlineCode(actual);
    const importPairs = Object.entries(expectedImports).flatMap(([key, value]) => {
        return value.map(v => [key, v] as const);
    });

    importPairs.forEach(([importFrom, importValue]) => {
        expect(normalizedActual).toMatch(new RegExp(`import{[^}]*\\b${importValue}\\b[^}]*}from'${importFrom}'`));
    });
}

export function codeStringAsRegex(code: string) {
    const stringAsRegex = escapeRegex(code)
        // Transform spaces between words into required whitespace.
        .replace(/(\w)\s+(\w)/g, '$1\\s+$2')
        // Do it again for single-character words — e.g. "as[ ]a[ ]token".
        .replace(/(\w)\s+(\w)/g, '$1\\s+$2')
        // Transform other spaces into optional whitespace.
        .replace(/\s+/g, '\\s*');
    return new RegExp(stringAsRegex);
}

async function normalizeCode(code: string) {
    try {
        code = await format(code, PRETTIER_OPTIONS);
    } catch (e) {
        // Ignore errors.
    }
    return code.trim();
}

async function inlineCode(code: string) {
    return (await normalizeCode(code)).replace(/\s+/g, ' ').replace(/\s*(\W)\s*/g, '$1');
}

function escapeRegex(stringAsRegex: string) {
    return stringAsRegex.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
