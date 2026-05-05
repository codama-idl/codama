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

    test('should resolve nested struct field value via path', async () => {
        const visitor = makeVisitor({ argumentsInput: { config: { threshold: 7 } } });
        const result = await visitor.visitArgumentValue(argumentValueNode('config', ['threshold']));
        expect(result).toBe(7);
    });

    test('should throw when intermediate struct arg is missing for nested path', async () => {
        const visitor = makeVisitor({ argumentsInput: {} });
        await expect(visitor.visitArgumentValue(argumentValueNode('config', ['threshold']))).rejects.toThrow(
            /Missing argument \[config\] in/,
        );
    });
});
