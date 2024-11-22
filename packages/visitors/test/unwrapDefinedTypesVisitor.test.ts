import {
    accountNode,
    assertIsNode,
    definedTypeLinkNode,
    definedTypeNode,
    numberTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapDefinedTypesVisitor } from '../src';

test('it unwraps defined types by following links', () => {
    // Given a program node with an account that uses a defined type link.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([structFieldTypeNode({ name: 'value', type: definedTypeLinkNode('myType') })]),
                name: 'myAccount',
            }),
        ],
        definedTypes: [definedTypeNode({ name: 'myType', type: numberTypeNode('u64') })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap the defined types.
    const result = visit(node, unwrapDefinedTypesVisitor(['myType']));

    // Then we expect the following tree.
    assertIsNode(result, 'programNode');
    expect(result.accounts[0].data).toStrictEqual(
        structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u64') })]),
    );
});

test('it follows linked nodes using the correct paths', () => {
    // Given two link nodes designed so that the path would
    // fail if we did not save and restored linked paths.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'typeA',
                type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
            }),
        ],
        name: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
            definedTypeNode({ name: 'typeB2', type: numberTypeNode('u64') }),
        ],
        name: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, [programB]);

    // When we unwrap the defined types in programB.
    const visitor = unwrapDefinedTypesVisitor(['typeB1', 'typeB2']);
    const result = visit(root, visitor);

    // Then we expect the final linkable to be resolved in programA.
    assertIsNode(result, 'rootNode');
    expect(result.program.definedTypes[0]).toStrictEqual(
        definedTypeNode({ name: 'typeA', type: numberTypeNode('u64') }),
    );
});

test('it does not unwrap types from the wrong programs', () => {
    // Given a program node with a defined type used in another type.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({ name: 'myType', type: numberTypeNode('u8') }),
            definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        name: 'programA',
        publicKey: '1111',
    });

    // And another program with a defined type sharing the same name.
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'myType', type: numberTypeNode('u16') }),
            definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        name: 'programB',
        publicKey: '2222',
    });

    // When we unwrap the defined type from programA.
    const node = rootNode(programA, [programB]);
    const result = visit(node, unwrapDefinedTypesVisitor(['myType']));

    // Then we expect programA to have been modified but not programB.
    assertIsNode(result, 'rootNode');
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                definedTypes: [definedTypeNode({ name: 'myCopyType', type: numberTypeNode('u8') })],
                name: 'programA',
                publicKey: '1111',
            }),
            [programB],
        ),
    );
});
