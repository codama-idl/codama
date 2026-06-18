import { getUtf8Codec } from '@solana/codecs';
import {
    argumentValueNode,
    constantValueNode,
    instructionArgumentNode,
    instructionNode,
    mapValueNode,
    numberTypeNode,
    stringTypeNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../../../src/visitors/pda-seed-value';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitConstantValue', () => {
    test('should delegate to inner stringValueNode', async () => {
        const node = constantValueNode(stringTypeNode('utf8'), stringValueNode('Hello world'));
        const result = await makeVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Hello world'));
    });

    test('should delegate to nested inner constantValueNode', async () => {
        const node = constantValueNode(
            stringTypeNode('utf8'),
            constantValueNode(stringTypeNode('utf8'), stringValueNode('Nested hello world')),
        );
        const result = await makeVisitor().visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('Nested hello world'));
    });

    test('should throw for unsupported inner node kind', async () => {
        const node = constantValueNode(numberTypeNode('u8'), mapValueNode([]));
        await expect(makeVisitor().visitConstantValue(node)).rejects.toThrow(
            `Expected node of kind [${PDA_SEED_VALUE_SUPPORTED_NODE_KINDS.join(',')}], got [mapValueNode]`,
        );
    });

    test('constantValueNode wrapping argumentValueNode resolves the argument', async () => {
        const visitor = makeVisitor({
            argumentsInput: { title: 'hello' },
            ixNode: instructionNode({
                arguments: [instructionArgumentNode({ name: 'title', type: stringTypeNode('utf8') })],
                name: 'testInstruction',
            }),
        });
        // @ts-expect-error Deliberate constraint violation for testing extended recursion through constantValueNode
        const node = constantValueNode(stringTypeNode('utf8'), argumentValueNode('title'));
        const result = await visitor.visitConstantValue(node);
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });
});
