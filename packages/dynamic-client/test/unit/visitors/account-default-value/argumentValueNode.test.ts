import {
    argumentValueNode,
    instructionArgumentNode,
    instructionNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitArgumentValue', () => {
    test('should return address from argument value', async () => {
        const addr = await SvmTestContext.generateAddress();
        const visitor = makeVisitor({ argumentsInput: { myArg: addr } });
        const result = await visitor.visitArgumentValue(argumentValueNode('myArg'));
        expect(result).toBe(addr);
    });

    test('should throw when argument is missing', async () => {
        const visitor = makeVisitor({ argumentsInput: {} });
        await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
            /Missing argument \[myArg\] in \[testInstruction\]/,
        );
    });

    test('should throw when argument is null', async () => {
        const visitor = makeVisitor({ argumentsInput: { myArg: null } });
        await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
            /Missing argument \[myArg\] in \[testInstruction\]/,
        );
    });

    describe('nested struct argument paths', () => {
        const ixNodeWithStructArg = instructionNode({
            arguments: [
                instructionArgumentNode({
                    name: 'config',
                    type: structTypeNode([structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() })]),
                }),
            ],
            name: 'testInstruction',
        });

        test('should resolve nested address from struct field', async () => {
            const addr = await SvmTestContext.generateAddress();
            const visitor = makeVisitor({
                argumentsInput: { config: { authority: addr } },
                ixNode: ixNodeWithStructArg,
            });
            const result = await visitor.visitArgumentValue(argumentValueNode('config', ['authority']));
            expect(result).toBe(addr);
        });

        test('should throw when intermediate struct arg is missing', async () => {
            const visitor = makeVisitor({
                argumentsInput: {},
                ixNode: ixNodeWithStructArg,
            });
            await expect(visitor.visitArgumentValue(argumentValueNode('config', ['authority']))).rejects.toThrow(
                /Missing argument \[config\] in \[testInstruction\]/,
            );
        });

        test('should throw when leaf field is missing on provided struct', async () => {
            const visitor = makeVisitor({
                argumentsInput: { config: {} },
                ixNode: ixNodeWithStructArg,
            });
            await expect(visitor.visitArgumentValue(argumentValueNode('config', ['authority']))).rejects.toThrow(
                /Missing argument \[config\.authority\] in \[testInstruction\]/,
            );
        });
    });

    test('should throw when argument cannot be converted to Address', async () => {
        const visitors: ReturnType<typeof makeVisitor>[] = [
            makeVisitor({ argumentsInput: { myArg: 'not-a-valid-base58' } }),
            makeVisitor({ argumentsInput: { myArg: { a: 42 } } }),
        ];
        for (const visitor of visitors) {
            await expect(visitor.visitArgumentValue(argumentValueNode('myArg'))).rejects.toThrow(
                /Expected \[Address \| PublicKey\] for account \[testAccount\]/,
            );
        }
    });
});
