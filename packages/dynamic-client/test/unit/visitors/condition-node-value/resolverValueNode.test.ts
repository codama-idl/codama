import { resolverValueNode } from 'codama';
import { describe, expect, test, vi } from 'vitest';

import { makeVisitor } from './condition-node-value-test-utils';

describe('condition-node-value: visitResolverValue', () => {
    test('should return undefined when resolversInput is undefined', async () => {
        const visitor = makeVisitor();
        const result = await visitor.visitResolverValue(resolverValueNode('myResolver'));
        expect(result).toBeUndefined();
    });

    test('should return undefined when resolver not in the resolversInput', async () => {
        const visitor = makeVisitor({ resolversInput: {} });
        const result = await visitor.visitResolverValue(resolverValueNode('myResolver'));
        expect(result).toBeUndefined();
    });

    test('should call resolver and return result', async () => {
        const visitor = makeVisitor({
            resolversInput: { myResolver: async () => await Promise.resolve(999) },
        });
        const result = await visitor.visitResolverValue(resolverValueNode('myResolver'));
        expect(result).toBe(999);
    });

    test('should throw ResolverError when resolver throws', async () => {
        const visitor = makeVisitor({
            resolversInput: {
                myResolver: () => {
                    throw new Error('some error');
                },
            },
        });
        await expect(visitor.visitResolverValue(resolverValueNode('myResolver'))).rejects.toThrow(
            /Resolver \[myResolver\] threw an error while resolving \[conditionalValueNode\] \[myResolver\]/,
        );
    });

    test('should pass arguments and accounts to resolver', async () => {
        const resolverSpy = vi.fn().mockReturnValue('resolved');
        const argumentsInput = { amount: 100 };
        const accountsInput = { treasury: null };

        const visitor = makeVisitor({
            accountsInput,
            argumentsInput,
            resolversInput: { myResolver: resolverSpy },
        });
        const result = await visitor.visitResolverValue(resolverValueNode('myResolver'));

        expect(result).toBe('resolved');
        expect(resolverSpy).toHaveBeenCalledWith(argumentsInput, accountsInput);
    });
});
