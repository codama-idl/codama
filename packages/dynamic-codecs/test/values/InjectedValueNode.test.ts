import { CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, isCodamaError } from '@codama/errors';
import { injectedValueNode } from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValueNodeVisitor } from '../../src';

test('it throws when an injectedValueNode reaches codec evaluation unresolved', () => {
    // Given an injectedValueNode that the provide/inject pass never replaced with a concrete value.
    const node = injectedValueNode({ key: 'decimals' });

    // When we visit it with the value-node codec visitor.
    const visitInjectedValue = () => visit(node, getValueNodeVisitor(new LinkableDictionary()));

    // Then it throws a pipeline invariant-violation error naming the unresolved node.
    expect(visitInjectedValue).toThrow(/injectedValueNode \(key "decimals"\) reached codec evaluation/);
    try {
        visitInjectedValue();
    } catch (error) {
        expect(isCodamaError(error, CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION)).toBe(true);
    }
});
