import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { describe, expect, test } from 'vitest';

import type * as v1 from '../../src/v1';
import {
    compactAndFreeze,
    decimalStringFromV1,
    definedTypeNodeFromV1,
    docsFromV1,
    identifierFromV1,
    integerStringFromV1,
    namespaceFromV1,
    pathFromV1,
    pluginNodeFromV1,
} from '../../src/v1ToV2';

describe('compactAndFreeze', () => {
    test('it drops undefined attributes and empty arrays', () => {
        expect(compactAndFreeze({ a: 1, b: undefined, c: [], d: [1], e: '' })).toStrictEqual({ a: 1, d: [1], e: '' });
    });

    test('it freezes the node and its array attributes, but not its other objects', () => {
        const result = compactAndFreeze({ items: [1, 2], payload: { nested: [3] } });
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.items)).toBe(true);
        expect(Object.isFrozen(result.payload)).toBe(false);
    });

    test('it freezes copies of array attributes, leaving the given arrays untouched', () => {
        const items = [1, 2];
        const result = compactAndFreeze({ items });
        expect(result.items).not.toBe(items);
        expect(Object.isFrozen(items)).toBe(false);
    });

    test('it produces upgraded trees whose nodes and arrays are all frozen', () => {
        // Given a v1 defined type exercising nested nodes, arrays, transforms and default values.
        const definedType = {
            docs: ['A config.'],
            kind: 'definedTypeNode',
            name: 'config',
            type: {
                fields: [
                    {
                        defaultValue: { items: [{ kind: 'numberValueNode', number: 1 }], kind: 'arrayValueNode' },
                        kind: 'structFieldTypeNode',
                        name: 'values',
                        type: {
                            count: { kind: 'fixedCountNode', value: 1 },
                            item: {
                                kind: 'fixedSizeTypeNode',
                                size: 8,
                                type: {
                                    kind: 'sizePrefixTypeNode',
                                    prefix: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
                                    type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                                },
                            },
                            kind: 'arrayTypeNode',
                        },
                    },
                    {
                        kind: 'structFieldTypeNode',
                        name: 'mode',
                        type: {
                            kind: 'enumTypeNode',
                            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            variants: [
                                { kind: 'enumEmptyVariantTypeNode', name: 'off' },
                                {
                                    kind: 'enumTupleVariantTypeNode',
                                    name: 'on',
                                    tuple: {
                                        items: [{ endian: 'le', format: 'f64', kind: 'numberTypeNode' }],
                                        kind: 'tupleTypeNode',
                                    },
                                },
                            ],
                        },
                    },
                ],
                kind: 'structTypeNode',
            },
        } as unknown as v1.DefinedTypeNode;
        const idl = {
            kind: 'rootNode',
            program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // When we upgrade it to v2.
        const result = definedTypeNodeFromV1([...path, definedType]);

        // Then every object and array of the result is frozen.
        const unfrozen = getUnfrozenPaths(result);
        expect(unfrozen).toStrictEqual([]);
    });

    test('it keeps plugin payloads as is', () => {
        const payload = { tags: [] };
        const plugin = { kind: 'pluginNode', name: 'explorerHints', payload } as unknown as v1.PluginNode;
        const result = pluginNodeFromV1(plugin);
        expect(Object.isFrozen(result)).toBe(true);
        expect(result.payload).toBe(payload);
        expect(Object.isFrozen(payload)).toBe(false);
    });
});

/** The paths of every object or array within the given value that is not frozen. */
function getUnfrozenPaths(value: unknown, path = 'root'): string[] {
    if (typeof value !== 'object' || value === null) return [];
    const own = Object.isFrozen(value) ? [] : [path];
    const children = Object.entries(value).flatMap(([key, child]) => getUnfrozenPaths(child, `${path}.${key}`));
    return [...own, ...children];
}

describe('identifierFromV1', () => {
    test('it carries v1 names over as v2 identifiers', () => {
        expect(identifierFromV1('transferTokens')).toBe('transferTokens');
    });

    test('it replaces the dashes of hand-written v1 names with underscores', () => {
        expect(identifierFromV1('token-2022')).toBe('token_2022');
    });

    test('it throws on other invalid v1 names', () => {
        expect(() => identifierFromV1('2fast')).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: '2fast',
                expected: 'identifier (letters, digits and underscores; no leading digit)',
            }),
        );
        expect(() => identifierFromV1('my token')).toThrow(
            expect.objectContaining({ context: expect.objectContaining({ actual: 'my token' }) }),
        );
    });
});

describe('pathFromV1', () => {
    test('it carries v1 names over as single-segment v2 paths', () => {
        expect(pathFromV1('amount')).toBe('amount');
        expect(pathFromV1('fee-rate')).toBe('fee_rate');
        expect(() => pathFromV1('fees.0')).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: 'fees.0',
                expected: 'path (e.g. "data.amount" or "[0].field")',
            }),
        );
    });
});

describe('namespaceFromV1', () => {
    test('it carries v1 plugin names over as v2 namespaces', () => {
        expect(namespaceFromV1('explorerHints')).toBe('explorerHints');
        expect(namespaceFromV1('explorer-hints')).toBe('explorer_hints');
        expect(() => namespaceFromV1('explorer hints')).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: 'explorer hints',
                expected: 'namespace (dot-separated identifiers)',
            }),
        );
    });
});

describe('docsFromV1', () => {
    test('it joins lines with line breaks', () => {
        expect(docsFromV1(['First line.', 'Second line.'])).toBe('First line.\nSecond line.');
    });

    test('it drops empty or missing docs', () => {
        expect(docsFromV1([])).toBeUndefined();
        expect(docsFromV1(undefined)).toBeUndefined();
    });
});

describe('integerStringFromV1', () => {
    test('it returns canonical integer strings', () => {
        expect(integerStringFromV1(42)).toBe('42');
        expect(integerStringFromV1(-7)).toBe('-7');
        expect(integerStringFromV1(-0)).toBe('0');
        expect(integerStringFromV1(1e21)).toBe('1000000000000000000000');
    });

    test('it keeps integers already rounded by the v1 JSON parsing', () => {
        expect(integerStringFromV1(JSON.parse('12048014319693667524') as number)).toBe('12048014319693668352');
    });

    test('it throws on non-integral numbers', () => {
        expect(() => integerStringFromV1(1.5)).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: '1.5',
                expected: 'integer (base-10, no leading zeros)',
            }),
        );
    });
});

describe('decimalStringFromV1', () => {
    test.each([
        [1.5, '1.5'],
        [-0.25, '-0.25'],
        [42, '42'],
        [1e21, '1000000000000000000000'],
        [1.5e21, '1500000000000000000000'],
        [1e-7, '0.0000001'],
        [-1.25e-7, '-0.000000125'],
        [-0, '-0'],
        [NaN, 'NaN'],
        [Infinity, 'Infinity'],
        [-Infinity, '-Infinity'],
    ])('it returns the canonical decimal string of %s', (value, expected) => {
        expect(decimalStringFromV1(value)).toBe(expected);
    });
});
