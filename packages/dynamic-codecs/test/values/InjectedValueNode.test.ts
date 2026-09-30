import { CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, CodamaError } from '@codama/errors';
import {
    injectedValueNode,
    integerValueNode,
    providedNode,
    structFieldValueNode,
    structValueNode,
} from '@codama/nodes';
import { LinkableDictionary, ProvidedScope, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it resolves injected values from the scope', () => {
    const scope = new ProvidedScope([providedNode('decimals', integerValueNode('9'))]);
    const visitor = getValueNodeVisitor(new LinkableDictionary(), { scope });
    expect(visit(injectedValueNode({ key: 'decimals' }), visitor)).toBe(9n);
});

test('it resolves nested injected values', () => {
    const scope = new ProvidedScope([providedNode('decimals', integerValueNode('9'))]);
    const visitor = getValueNodeVisitor(new LinkableDictionary(), { scope });
    const node = structValueNode([structFieldValueNode('decimals', injectedValueNode({ key: 'decimals' }))]);
    expect(visit(node, visitor)).toStrictEqual({ decimals: 9n });
});

test('it uses the fallback when the value is not provided', () => {
    const visitor = getValueNodeVisitor(new LinkableDictionary());
    const node = injectedValueNode({ fallback: integerValueNode('6'), key: 'decimals' });
    expect(visit(node, visitor)).toBe(6n);
});

test('it throws when the value is not provided and has no fallback', () => {
    const node = injectedValueNode({ key: 'decimals' });
    const visitor = getValueNodeVisitor(new LinkableDictionary());
    expect(() => visit(node, visitor)).toThrow(
        new CodamaError(CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, {
            injectedValue: node,
            key: node.key,
        }),
    );
});
