import { resolverValueNode } from 'codama';
import { describe, expect, test, vi } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitResolverValue', () => {
    test('should call resolver and return address', async () => {
        const addr = SvmTestContext.generateAddress();
        const visitor = makeVisitor({
            resolversInput: { myResolver: () => Promise.resolve(addr) },
        });
        const result = await visitor.visitResolverValue(resolverValueNode('myResolver'));
        expect(result).toBe(addr);
    });

    test('should throw when resolver is not provided', async () => {
        const visitor = makeVisitor();
        await expect(visitor.visitResolverValue(resolverValueNode('myResolver'))).rejects.toThrow(
            /Resolver "myResolver" not provided for account "testAccount"/,
        );
    });

    test('should throw when resolver returns null', async () => {
        const visitor = makeVisitor({
            resolversInput: { myResolver: () => Promise.resolve(null) },
        });
        await expect(visitor.visitResolverValue(resolverValueNode('myResolver'))).rejects.toThrow(
            /Resolver "myResolver" returned invalid address null for account "testAccount"/,
        );
    });

    test('should throw when resolver returns undefined', async () => {
        const visitor = makeVisitor({
            resolversInput: { myResolver: () => Promise.resolve(undefined) },
        });
        await expect(visitor.visitResolverValue(resolverValueNode('myResolver'))).rejects.toThrow(
            /Resolver "myResolver" returned invalid address undefined for account "testAccount"/,
        );
    });

    test('should pass arguments and accounts to resolver', async () => {
        const addr = SvmTestContext.generateAddress();
        const resolverSpy = vi.fn().mockResolvedValue(addr);
        const argumentsInput = { amount: 100 };
        const accountsInput = { treasury: addr };

        const visitor = makeVisitor({
            accountsInput,
            argumentsInput,
            resolversInput: { myResolver: resolverSpy },
        });
        await visitor.visitResolverValue(resolverValueNode('myResolver'));

        expect(resolverSpy).toHaveBeenCalledWith(argumentsInput, accountsInput);
    });
});
