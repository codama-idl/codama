import {
    array,
    boolean,
    codamaVersion,
    docs,
    enumeration,
    literal,
    literalUnion,
    nestedUnion,
    node,
    string,
    stringIdentifier,
    stringVersion,
    tuple,
    u32,
    union,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getTypeExprFragment } from '../../../src/nodes/fragments/typeExpr';

describe('getTypeExprFragment', () => {
    it('renders plain string', () => {
        expect(getTypeExprFragment(string()).content).toBe('string');
    });

    it('renders integer as number', () => {
        expect(getTypeExprFragment(u32()).content).toBe('number');
    });

    it('renders boolean', () => {
        expect(getTypeExprFragment(boolean()).content).toBe('boolean');
    });

    it('renders a string literal as a JSON-quoted source-form literal', () => {
        expect(getTypeExprFragment(literal('codama')).content).toBe('"codama"');
    });

    it('renders a boolean literal', () => {
        expect(getTypeExprFragment(literal(true)).content).toBe('true');
    });

    it('joins literalUnion members with " | "', () => {
        expect(getTypeExprFragment(literalUnion(1, 2, 'three')).content).toBe('1 | 2 | "three"');
    });

    it('collapses `true | false` to `boolean` and appends remaining literals', () => {
        expect(getTypeExprFragment(literalUnion(true, false, 'either')).content).toBe('boolean | "either"');
    });

    it('collapses `true | false` alone to `boolean`', () => {
        expect(getTypeExprFragment(literalUnion(true, false)).content).toBe('boolean');
    });

    it('does not collapse a single boolean literal', () => {
        expect(getTypeExprFragment(literalUnion(true, 'either')).content).toBe('true | "either"');
    });

    it('routes stringIdentifier to the CamelCaseString brand imported from @codama/node-types', () => {
        const result = getTypeExprFragment(stringIdentifier());
        expect(result.content).toBe('CamelCaseString');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes stringVersion to the Version alias imported from @codama/node-types', () => {
        const result = getTypeExprFragment(stringVersion());
        expect(result.content).toBe('Version');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes codamaVersion to the CodamaVersion alias imported from @codama/node-types', () => {
        const result = getTypeExprFragment(codamaVersion());
        expect(result.content).toBe('CodamaVersion');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes docs to the Docs alias imported from @codama/node-types', () => {
        const result = getTypeExprFragment(docs());
        expect(result.content).toBe('Docs');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes enumeration references to @codama/node-types', () => {
        const result = getTypeExprFragment(enumeration('Endianness'));
        expect(result.content).toBe('Endianness');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes node references to @codama/node-types under their PascalCase name', () => {
        const result = getTypeExprFragment(node('innerTypeNode'));
        expect(result.content).toBe('InnerTypeNode');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('routes union references to @codama/node-types under their PascalCase name', () => {
        const result = getTypeExprFragment(union('TypeNode'));
        expect(result.content).toBe('TypeNode');
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
    });

    it('renders array(T) as Array<T>', () => {
        expect(getTypeExprFragment(array(boolean())).content).toBe('Array<boolean>');
    });

    it('handles nested array types', () => {
        expect(getTypeExprFragment(array(array(string()))).content).toBe('Array<Array<string>>');
    });

    it('does not need extra parens around an inline literal-union array element', () => {
        // The `Array<…>` wrapping makes precedence unambiguous, so a
        // literal-union element is emitted without extra parens.
        expect(getTypeExprFragment(array(literalUnion(true, 'either'))).content).toBe('Array<true | "either">');
    });

    it('renders nestedUnion wrapping with both wrapper and inner imports merged into one @codama/node-types entry', () => {
        const result = getTypeExprFragment(nestedUnion('NestedTypeNode', 'innerTypeNode'));
        expect(result.content).toBe('NestedTypeNode<InnerTypeNode>');
        // Both identifiers come from the same package; they collapse to a
        // single import-map entry holding two identifiers.
        expect([...result.imports.keys()]).toEqual(['@codama/node-types']);
        const ids = [...result.imports.get('@codama/node-types')!.values()].map(i => i.usedIdentifier).sort();
        expect(ids).toEqual(['InnerTypeNode', 'NestedTypeNode']);
    });

    it('renders an empty tuple as []', () => {
        expect(getTypeExprFragment(tuple()).content).toBe('[]');
    });

    it('renders a multi-element tuple with comma-separated items', () => {
        expect(getTypeExprFragment(tuple(boolean(), string())).content).toBe('[boolean, string]');
    });

    it('emits a valid TS string literal even when the value contains characters that need escaping', () => {
        // Escaping is delegated to `JSON.stringify`. Confirm here that
        // the renderer produces a double-quoted source-form literal
        // whose backslashes and newlines have been escaped — i.e. the
        // value cannot break out of the string.
        const out = getTypeExprFragment(literal('a\\b\nc')).content;
        expect(out.startsWith('"') && out.endsWith('"')).toBe(true);
        expect(out).not.toContain('\n');
    });
});
