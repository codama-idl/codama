import {
    accountNode,
    assertIsNode,
    definedTypeLinkNode,
    definedTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapTypeDefinedLinksVisitor } from '../src';

test('it replaces the selected links with their types and keeps the defined types', () => {
    // Given an account using a defined type.
    const definedType = definedTypeNode({ identifier: 'myType', type: integerTypeNode('u64') });
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'value', type: definedTypeLinkNode('myType') }),
                ]),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [definedType],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap the links inside the account.
    const result = visit(node, unwrapTypeDefinedLinksVisitor(['myAccount.value.[definedTypeLinkNode]myType']));

    // Then the link is replaced and the defined type is kept.
    expect(result).toStrictEqual(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u64') })]),
                    identifier: 'myAccount',
                }),
            ],
            definedTypes: [definedType],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});

test('it layers the transforms of the link on top of the inlined type', () => {
    // Given a link with transforms.
    const node = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('myType', { transforms: [fixedSizeTransformNode(16)] }),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u64') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap it.
    const result = visit(node, unwrapTypeDefinedLinksVisitor(['myType']));

    // Then the link's transforms are carried over.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0].data).toStrictEqual(
        integerTypeNode('u64', { transforms: [fixedSizeTransformNode(16)] }),
    );
});

test('it qualifies links inside types inlined into another program', () => {
    // Given programA linking to a type of programB that links to another type of programB.
    const programA = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('wrapper', { program: programLinkNode('programB') }),
                identifier: 'myAccount',
            }),
        ],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'wrapper', type: definedTypeLinkNode('inner') }),
            definedTypeNode({ identifier: 'inner', type: integerTypeNode('u8') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we unwrap the link in programA.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        unwrapTypeDefinedLinksVisitor(['myAccount.[definedTypeLinkNode]wrapper']),
    );

    // Then the inner link now explicitly points to programB.
    assertIsNode(result, 'rootNode');
    expect(result.program.accounts?.[0].data).toStrictEqual(
        definedTypeLinkNode('inner', { program: programLinkNode('programB') }),
    );
});
