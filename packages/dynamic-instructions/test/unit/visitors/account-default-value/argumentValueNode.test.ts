import { argumentValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitArgumentValue', () => {
    test('should return address from argument value', async () => {
        const addr = SvmTestContext.generateAddress();
        const visitor = makeVisitor({ argumentsInput: { myArg: addr } });
        const result = await visitor.visitArgumentValue(argumentValueNode('myArg'));
        expect(result).toBe(addr);
    });

    test('should throw when argument is missing', async () => {
        const visitor = makeVisitor({ argumentsInput: {} });
        await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
            /Missing required argument for account default: myArg/,
        );
    });

    test('should throw when argument is null', async () => {
        const visitor = makeVisitor({ argumentsInput: { myArg: null } });
        await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
            /Missing required argument for account default: myArg/,
        );
    });

    test('should throw when argument cannot be converted to Address', async () => {
        const visitors: ReturnType<typeof makeVisitor>[] = [
            makeVisitor({ argumentsInput: { myArg: 'not-a-valid-base58' } }),
            makeVisitor({ argumentsInput: { myArg: { a: 42 } } }),
        ];
        for (const visitor of visitors) {
            await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
                /Argument myArg is not a valid Address/,
            );
        }
    });
});
