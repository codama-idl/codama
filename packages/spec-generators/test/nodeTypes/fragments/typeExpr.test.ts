import {
    address,
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
    u32,
    union,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getTypeExprFragment, getTypeExprWithSelfAliasFragment } from '../../../src/nodeTypes/fragments/typeExpr';

describe('getTypeExprFragment', () => {
    it('renders plain string', () => {
        expect(getTypeExprFragment(string()).content).toBe('string');
    });

    it('renders address as plain string for v1 (no brand, no import)', () => {
        const result = getTypeExprFragment(address());
        expect(result.content).toBe('string');
        expect(result.imports.size).toBe(0);
    });

    it('renders integer as number', () => {
        expect(getTypeExprFragment(u32()).content).toBe('number');
    });

    it('renders boolean', () => {
        expect(getTypeExprFragment(boolean()).content).toBe('boolean');
    });

    it('renders string literal', () => {
        expect(getTypeExprFragment(literal('codama')).content).toBe('"codama"');
    });

    it('renders boolean literal', () => {
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

    it('emits CamelCaseString for stringIdentifier with a brand: import key', () => {
        const result = getTypeExprFragment(stringIdentifier());
        expect(result.content).toBe('CamelCaseString');
        expect([...result.imports.keys()]).toEqual(['brand:CamelCaseString']);
    });

    it('emits Version for stringVersion with a version: import key', () => {
        const result = getTypeExprFragment(stringVersion());
        expect(result.content).toBe('Version');
        expect([...result.imports.keys()]).toEqual(['version:Version']);
    });

    it('emits CodamaVersion for codamaVersion with a version: import key', () => {
        const result = getTypeExprFragment(codamaVersion());
        expect(result.content).toBe('CodamaVersion');
        expect([...result.imports.keys()]).toEqual(['version:CodamaVersion']);
    });

    it('emits a Docs reference imported from docs:Docs', () => {
        const result = getTypeExprFragment(docs());
        expect(result.content).toBe('Docs');
        expect([...result.imports.keys()]).toEqual(['docs:Docs']);
    });

    it('renders enumeration references with an enumeration: import key', () => {
        const result = getTypeExprFragment(enumeration('Endianness'));
        expect(result.content).toBe('Endianness');
        expect([...result.imports.keys()]).toEqual(['enumeration:Endianness']);
    });

    it('renders node references with PascalCase identifiers and a node: import key', () => {
        const result = getTypeExprFragment(node('innerTypeNode'));
        expect(result.content).toBe('InnerTypeNode');
        expect([...result.imports.keys()]).toEqual(['node:innerTypeNode']);
    });

    it('renders union references with a union: import key', () => {
        const result = getTypeExprFragment(union('TypeNode'));
        expect(result.content).toBe('TypeNode');
        expect([...result.imports.keys()]).toEqual(['union:TypeNode']);
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

    it('renders nestedUnion wrapping with both nestedUnion: and node: import keys', () => {
        const result = getTypeExprFragment(nestedUnion('NestedTypeNode', 'innerTypeNode'));
        expect(result.content).toBe('NestedTypeNode<InnerTypeNode>');
        expect([...result.imports.keys()].sort()).toEqual(['nestedUnion:NestedTypeNode', 'node:innerTypeNode']);
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

describe('getTypeExprWithSelfAliasFragment', () => {
    it('substitutes the self-alias for direct node references matching the kind', () => {
        const result = getTypeExprWithSelfAliasFragment(node('fooNode'), 'fooNode', 'SelfFooNode');
        expect(result.content).toBe('SelfFooNode');
        // The substitution emits a raw identifier — no symbolic import.
        expect(result.imports.size).toBe(0);
    });

    it('leaves non-matching node references untouched, including their symbolic import', () => {
        const result = getTypeExprWithSelfAliasFragment(node('otherNode'), 'fooNode', 'SelfFooNode');
        expect(result.content).toBe('OtherNode');
        expect([...result.imports.keys()]).toEqual(['node:otherNode']);
    });

    it('recurses the substitution through array(node(kind))', () => {
        const result = getTypeExprWithSelfAliasFragment(array(node('fooNode')), 'fooNode', 'SelfFooNode');
        expect(result.content).toBe('Array<SelfFooNode>');
    });

    it('does not recurse into union references — they are name-aliased and break the cycle', () => {
        const result = getTypeExprWithSelfAliasFragment(union('FooUnion'), 'fooNode', 'SelfFooNode');
        expect(result.content).toBe('FooUnion');
        expect([...result.imports.keys()]).toEqual(['union:FooUnion']);
    });

    it('delegates to getTypeExprFragment for primitive types', () => {
        // Primitives have no node references, so the substitution is a
        // no-op and the result matches the regular renderer.
        expect(getTypeExprWithSelfAliasFragment(boolean(), 'fooNode', 'SelfFooNode').content).toBe('boolean');
    });
});
