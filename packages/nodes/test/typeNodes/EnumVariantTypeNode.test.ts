import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import {
    enumVariantDisplayNode,
    enumVariantTypeNode,
    integerTypeNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = enumVariantTypeNode('apple');
    expect(node.kind).toBe('enumVariantTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumVariantTypeNode('apple');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it creates a unit variant when no data is provided', () => {
    const node = enumVariantTypeNode('apple');
    expect(node.identifier).toBe('apple');
    expect('data' in node).toBe(false);
});

test('it creates a struct variant when given a struct type', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'weight', type: integerTypeNode('u32') })]);
    const node = enumVariantTypeNode('apple', { data });
    expect(node.data).toBe(data);
});

test('it creates a tuple variant when given a tuple type', () => {
    const data = tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]);
    const node = enumVariantTypeNode('apple', { data });
    expect(node.data).toBe(data);
});

test('it carries any other type node as-is', () => {
    const node = enumVariantTypeNode('apple', { data: publicKeyTypeNode() });
    expect(node.data).toEqual(publicKeyTypeNode());
});

test('it omits the discriminator when not provided', () => {
    const node = enumVariantTypeNode('apple');
    expect('discriminator' in node).toBe(false);
});

test('it keeps the provided discriminator, docs and display', () => {
    const display = enumVariantDisplayNode({ label: 'Apple' });
    const node = enumVariantTypeNode('apple', { discriminator: 42, display, docs: 'A red fruit.' });
    expect(node.discriminator).toBe(42);
    expect(node.docs).toBe('A red fruit.');
    expect(node.display).toBe(display);
});

test('it preserves the identifier casing', () => {
    const node = enumVariantTypeNode('RedApple');
    expect(node.identifier).toBe('RedApple');
});

test('it rejects invalid identifiers', () => {
    expect(() => enumVariantTypeNode('1apple')).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: '1apple',
            expected: 'identifier (letters, digits and underscores; no leading digit)',
        }),
    );
});
