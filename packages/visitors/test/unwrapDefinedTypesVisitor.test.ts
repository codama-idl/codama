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
