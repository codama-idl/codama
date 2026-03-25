import { definedTypeLinkNode, definedTypeNode, numberTypeNode, programNode, rootNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';

describe('definedTypeLinkNode', () => {
    test('should resolve defined type and delegate', () => {
        const root = rootNode(
            programNode({
                definedTypes: [definedTypeNode({ name: 'myNumber', type: numberTypeNode('u64') })],
                name: 'test',
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const transformer = createInputValueTransformer(definedTypeLinkNode('myNumber'), root);
        expect(transformer(42)).toBe(42);
    });

    test('should throw for unknown type name', () => {
        const root = rootNode(
            programNode({
                name: 'test',
                publicKey: '11111111111111111111111111111111',
            }),
        );
        expect(() => createInputValueTransformer(definedTypeLinkNode('nonExistent'), root)).toThrow(
            'Cannot resolve defined type link: nonExistent',
        );
    });
});
