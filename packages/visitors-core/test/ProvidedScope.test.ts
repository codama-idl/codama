import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE,
    CodamaError,
} from '@codama/errors';
import {
    accountValueNode,
    identifierString,
    injectedValueNode,
    integerValueNode,
    providedNode,
    publicKeyTypeNode,
    stringValueNode,
    structFieldValueNode,
    structValueNode,
    VALUE_NODES,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { ProvidedScope } from '../src';

const kinds = ['accountValueNode' as const, 'integerValueNode' as const];

test('it resolves an injection to its provided node', () => {
    const scope = new ProvidedScope([providedNode('decimals', integerValueNode('6'))]);
    expect(scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds })).toEqual(integerValueNode('6'));
});

test('it lets inner frames shadow outer frames', () => {
    const scope = new ProvidedScope(
        [providedNode('authority', accountValueNode('outer'))],
        [providedNode('authority', accountValueNode('inner'))],
    );
    expect(scope.resolve(injectedValueNode({ key: 'authority' }), { kinds })).toEqual(accountValueNode('inner'));
});

test('it keeps outer frames visible', () => {
    const scope = new ProvidedScope(
        [providedNode('decimals', integerValueNode('6'))],
        [providedNode('authority', accountValueNode('owner'))],
    );
    expect(scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds })).toEqual(integerValueNode('6'));
});

test('it returns the fallback when no frame provides the key', () => {
    const scope = new ProvidedScope();
    const node = injectedValueNode({ fallback: integerValueNode('9'), key: 'decimals' });
    expect(scope.resolve(node, { kinds })).toEqual(integerValueNode('9'));
});

test('it returns undefined when no frame provides the key and there is no fallback', () => {
    const scope = new ProvidedScope();
    expect(scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds })).toBeUndefined();
});

test('it resolves an injected fallback against the same frames', () => {
    const scope = new ProvidedScope([providedNode('defaultDecimals', integerValueNode('9'))]);
    const node = injectedValueNode({ fallback: injectedValueNode({ key: 'defaultDecimals' }), key: 'decimals' });
    expect(scope.resolve(node, { kinds })).toEqual(integerValueNode('9'));
});

test('it resolves a provided injection against the outer frames only', () => {
    // Given an inner frame that re-provides a key by injecting that same key.
    const scope = new ProvidedScope(
        [providedNode('decimals', integerValueNode('6'))],
        [providedNode('decimals', injectedValueNode({ key: 'decimals' }))],
    );

    // Then it resolves to the outer provider rather than looping.
    expect(scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds })).toEqual(integerValueNode('6'));
});

test('it uses the fallback when a provided injection chain dead-ends', () => {
    // Given a frame that provides a key by injecting a key nobody provides.
    const scope = new ProvidedScope([providedNode('decimals', injectedValueNode({ key: 'missing' }))]);

    // Then the consumer's own fallback is used.
    const node = injectedValueNode({ fallback: integerValueNode('9'), key: 'decimals' });
    expect(scope.resolve(node, { kinds })).toEqual(integerValueNode('9'));
});

test('it resolves injections nested within a node', () => {
    // Given a struct value with an injected field.
    const scope = new ProvidedScope([providedNode('age', integerValueNode('42'))]);
    const node = structValueNode([
        structFieldValueNode('name', stringValueNode('Alice')),
        structFieldValueNode('age', injectedValueNode({ key: 'age' })),
    ]);

    // Then the nested injection is replaced by its provided node.
    expect(scope.resolve(node, { kinds: VALUE_NODES })).toEqual(
        structValueNode([
            structFieldValueNode('name', stringValueNode('Alice')),
            structFieldValueNode('age', integerValueNode('42')),
        ]),
    );
});

test('it treats a node with an unresolvable nested injection as unresolvable', () => {
    // Given a struct value with an injected field that nothing provides.
    const node = structValueNode([
        structFieldValueNode('name', stringValueNode('Alice')),
        structFieldValueNode('age', injectedValueNode({ key: 'age' })),
    ]);

    // Then the whole value is unresolvable rather than partially resolved.
    expect(new ProvidedScope().resolve(node, { kinds: VALUE_NODES })).toBeUndefined();
});

test('it returns a node without injections as-is', () => {
    const node = structValueNode([structFieldValueNode('name', stringValueNode('Alice'))]);
    expect(new ProvidedScope().resolve(node, { kinds: VALUE_NODES })).toBe(node);
});

test('it attributes a wrong-kind fallback of a provided injection to its provider', () => {
    // Given a frame providing a key through an injection whose own fallback has the wrong kind.
    const provider = providedNode('symbol', injectedValueNode({ fallback: integerValueNode('9'), key: 'missing' }));
    const scope = new ProvidedScope([provider]);

    // Then the error names the provider.
    expect(() => scope.resolve(injectedValueNode({ key: 'symbol' }), { kinds: ['stringValueNode'] })).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, {
            expectedKinds: ['stringValueNode'],
            key: identifierString('symbol'),
            providedKind: 'integerValueNode',
            provider,
        }),
    );
});

test('it resolves injections within a provided node against the outer frames', () => {
    // Given an inner frame providing a struct that injects a key both frames provide.
    const scope = new ProvidedScope(
        [providedNode('age', integerValueNode('1'))],
        [
            providedNode('age', integerValueNode('2')),
            providedNode('person', structValueNode([structFieldValueNode('age', injectedValueNode({ key: 'age' }))])),
        ],
    );

    // Then the nested injection resolves outside the frame providing the struct.
    expect(scope.resolve(injectedValueNode({ key: 'person' }), { kinds: VALUE_NODES })).toEqual(
        structValueNode([structFieldValueNode('age', integerValueNode('1'))]),
    );
});

test('it throws when a fallback is not one of the expected kinds', () => {
    const node = injectedValueNode({ fallback: integerValueNode('9'), key: 'symbol' });
    expect(() => new ProvidedScope().resolve(node, { kinds: ['stringValueNode'] })).toThrow(
        new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['stringValueNode'],
            kind: 'integerValueNode',
            node: integerValueNode('9'),
        }),
    );
});

test('it throws when the provided node is not one of the expected kinds', () => {
    const provider = providedNode('decimals', publicKeyTypeNode());
    const scope = new ProvidedScope([provider]);
    expect(() => scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds })).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE, {
            expectedKinds: kinds,
            key: identifierString('decimals'),
            providedKind: 'publicKeyTypeNode',
            provider,
        }),
    );
});

test('it pushes and pops frames', () => {
    const scope = new ProvidedScope();
    scope.push([providedNode('symbol', stringValueNode('SOL'))]);
    expect(scope.get(identifierString('symbol'))).toEqual(providedNode('symbol', stringValueNode('SOL')));
    scope.pop();
    expect(scope.get(identifierString('symbol'))).toBeUndefined();
});

test('it clones into an independent scope', () => {
    const scope = new ProvidedScope([providedNode('symbol', stringValueNode('SOL'))]);
    const clone = scope.clone();
    clone.pop();
    expect(scope.get(identifierString('symbol'))).toBeDefined();
    expect(clone.get(identifierString('symbol'))).toBeUndefined();
});
