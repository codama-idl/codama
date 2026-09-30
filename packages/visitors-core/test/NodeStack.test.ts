import { definedTypeNode, integerTypeNode, programNode, publicKeyTypeNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { NodeStack, pipe, recordNodeStackVisitor, tapVisitor, voidVisitor } from '../src';

const slot = definedTypeNode({ identifier: 'slot', type: integerTypeNode('u64') });
const owner = definedTypeNode({ identifier: 'owner', type: publicKeyTypeNode() });
const root = rootNode(programNode({ definedTypes: [slot, owner], identifier: 'myProgram', publicKey: '1111' }));

test('withPath runs the callback with the given path and restores the previous one', () => {
    // Given a stack within the owner type.
    const stack = new NodeStack([root, root.program, owner]);

    // When we run a callback with the path of the slot type.
    const result = stack.withPath([root, root.program, slot], () => stack.getPath());

    // Then the callback sees that path, and the previous path is restored.
    expect(result).toStrictEqual([root, root.program, slot]);
    expect(stack.getPath()).toStrictEqual([root, root.program, owner]);
});

test('withPath restores the previous path when the callback throws', () => {
    const stack = new NodeStack([root, root.program, owner]);
    expect(() =>
        stack.withPath([root, root.program, slot], () => {
            throw new Error('boom');
        }),
    ).toThrow('boom');
    expect(stack.getPath()).toStrictEqual([root, root.program, owner]);
});

test('visitPath visits the last node of the path with the path recorded once', () => {
    // Given a stack within the owner type and a visitor recording the paths of integer types.
    const stack = new NodeStack([root, root.program, owner]);
    const paths: unknown[] = [];
    const visitor = pipe(
        voidVisitor(),
        v => tapVisitor(v, 'integerTypeNode', () => paths.push(stack.getPath())),
        v => recordNodeStackVisitor(v, stack),
    );

    // When we visit the path of the slot type.
    stack.visitPath([root, root.program, slot], visitor);

    // Then its type is visited with the slot type recorded once, rather than twice.
    expect(paths).toStrictEqual([[root, root.program, slot, slot.type]]);

    // And the previous path is restored.
    expect(stack.getPath()).toStrictEqual([root, root.program, owner]);
});

test('visitPath restores the previous path when the visit throws', () => {
    const stack = new NodeStack([root, root.program, owner]);
    const visitor = pipe(
        voidVisitor(),
        v => recordNodeStackVisitor(v, stack),
        v =>
            tapVisitor(v, 'integerTypeNode', () => {
                throw new Error('boom');
            }),
    );
    expect(() => stack.visitPath([root, root.program, slot], visitor)).toThrow('boom');
    expect(stack.getPath()).toStrictEqual([root, root.program, owner]);
});
