import { definedTypeLinkNode, definedTypeNode, numberTypeNode, programNode, rootNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';

describe('definedTypeLinkNode', () => {
    test('should resolve defined type and delegate', () => {
        const root = rootNode(
            programNode({
                definedTypes: [definedTypeNode({ name: 'myNumber', type: numberTypeNode('u64') })],
                name: 'test',
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const transformer = createCodecInputTransformer(definedTypeLinkNode('myNumber'), root);
        expect(transformer(42)).toBe(42);
    });

    test('should throw for unknown type name', () => {
        const root = rootNode(
            programNode({
                name: 'test',
                publicKey: '11111111111111111111111111111111',
            }),
        );
        expect(() => createCodecInputTransformer(definedTypeLinkNode('nonExistent'), root)).toThrow(
            /Could not find linked node \[nonExistent\] from \[definedTypeLinkNode\]/,
        );
    });
});
