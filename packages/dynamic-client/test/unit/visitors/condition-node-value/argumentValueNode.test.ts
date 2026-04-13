import { argumentValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './condition-node-value-test-utils';

describe('condition-node-value: visitArgumentValue', () => {
    test('should return argument value', async () => {
        const visitor = makeVisitor({ argumentsInput: { amount: 42 } });
        const result = await visitor.visitArgumentValue(argumentValueNode('amount'));
        expect(result).toBe(42);
    });

    test('should return undefined for missing argument', async () => {
        const visitor = makeVisitor({ argumentsInput: {} });
        const result = await visitor.visitArgumentValue(argumentValueNode('amount'));
        expect(result).toBeUndefined();
    });
});
