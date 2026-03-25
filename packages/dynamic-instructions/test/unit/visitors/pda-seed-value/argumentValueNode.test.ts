import { getUtf8Codec } from '@solana/codecs';
import {
    argumentValueNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    publicKeyTypeNode,
    remainderOptionTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitArgumentValue', () => {
    const ixNodeWithArg = instructionNode({
        arguments: [instructionArgumentNode({ name: 'title', type: stringTypeNode('utf8') })],
        name: 'testInstruction',
    });

    test('should encode argument value using its codec', async () => {
        const visitor = makeVisitor({
            argumentsInput: { title: 'hello' },
            ixNode: ixNodeWithArg,
        });
        const result = await visitor.visitArgumentValue(argumentValueNode('title'));
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });

    test('should use seedTypeNode override instead of argument type', async () => {
        // Argument type is sizePrefixTypeNode (u32 length prefix + utf8 string),
        // but seedTypeNode overrides it to plain stringTypeNode (raw utf8 bytes only).
        // This mirrors how on-chain PDA derivation uses raw string bytes as seeds,
        // even when the instruction argument is serialized with a length prefix.
        const sizePrefixedArgType = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
        const ixNodeWithSizePrefixedArg = instructionNode({
            arguments: [instructionArgumentNode({ name: 'name', type: sizePrefixedArgType })],
            name: 'testInstruction',
        });

        const visitor = makeVisitor({
            argumentsInput: { name: 'hello' },
            ixNode: ixNodeWithSizePrefixedArg,
            seedTypeNode: stringTypeNode('utf8'),
        });
        const result = await visitor.visitArgumentValue(argumentValueNode('name'));

        // Should produce raw utf8 bytes (5 bytes), NOT size-prefixed bytes (4 + 5 = 9 bytes)
        const rawUtf8Bytes = getUtf8Codec().encode('hello');
        expect(result).toEqual(rawUtf8Bytes);
        expect(result.length).toBe(5);
    });

    test('should throw for unknown argument name', async () => {
        const visitor = makeVisitor({ ixNode: ixNodeWithArg });
        await expect(visitor.visitArgumentValue(argumentValueNode('unknown'))).rejects.toThrow(
            /Missing instruction argument node/,
        );
    });

    test('should throw when required argument value is undefined', async () => {
        const visitor = makeVisitor({
            argumentsInput: {},
            ixNode: ixNodeWithArg,
        });
        await expect(visitor.visitArgumentValue(argumentValueNode('title'))).rejects.toThrow(
            /Missing argument for PDA seed/,
        );
    });

    test('should throw when required argument value is null', async () => {
        const visitor = makeVisitor({
            argumentsInput: { title: null },
            ixNode: ixNodeWithArg,
        });
        await expect(visitor.visitArgumentValue(argumentValueNode('title'))).rejects.toThrow(
            /Missing argument for PDA seed/,
        );
    });

    describe('remainderOptionTypeNode seeds', () => {
        // Mirrors the pmp IDL's metadata PDA:
        // the "authority" seed is remainderOptionTypeNode(publicKeyTypeNode) — null is canonical.
        const ixNodeWithOptionalSeed = instructionNode({
            arguments: [
                instructionArgumentNode({
                    name: 'authority',
                    type: remainderOptionTypeNode(publicKeyTypeNode()),
                }),
            ],
            name: 'testInstruction',
        });

        test('should return empty bytes when argument is undefined', async () => {
            const visitor = makeVisitor({
                argumentsInput: {},
                ixNode: ixNodeWithOptionalSeed,
            });
            const result = await visitor.visitArgumentValue(argumentValueNode('authority'));
            expect(result).toEqual(new Uint8Array(0));
        });

        test('should return empty bytes when argument is null', async () => {
            const visitor = makeVisitor({
                argumentsInput: { authority: null },
                ixNode: ixNodeWithOptionalSeed,
            });
            const result = await visitor.visitArgumentValue(argumentValueNode('authority'));
            expect(result).toEqual(new Uint8Array(0));
        });

        test('should encode value when argument is provided', async () => {
            const authority = SvmTestContext.generateAddress();
            const visitor = makeVisitor({
                argumentsInput: { authority },
                ixNode: ixNodeWithOptionalSeed,
            });
            const result = await visitor.visitArgumentValue(argumentValueNode('authority'));
            expect(result.length).toBe(32);
        });

        test('should return empty bytes when seedTypeNode override is remainderOptionTypeNode and argument is null', async () => {
            const ixNodeWithRequiredArg = instructionNode({
                arguments: [instructionArgumentNode({ name: 'authority', type: publicKeyTypeNode() })],
                name: 'testInstruction',
            });
            const visitor = makeVisitor({
                argumentsInput: { authority: null },
                ixNode: ixNodeWithRequiredArg,
                seedTypeNode: remainderOptionTypeNode(publicKeyTypeNode()),
            });
            const result = await visitor.visitArgumentValue(argumentValueNode('authority'));
            expect(result).toEqual(new Uint8Array(0));
        });
    });
});
