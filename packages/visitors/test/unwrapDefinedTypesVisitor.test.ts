import {
    accountNode,
    arrayTypeNode,
    assertIsNode,
    constantNode,
    definedTypeLinkNode,
    definedTypeNode,
    eventNode,
    fixedSizeTransformNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    pdaNode,
    programLinkNode,
    programNode,
    remainderCountNode,
    rootNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapDefinedTypesVisitor } from '../src';

test('it unwraps defined types by following links', () => {
    // Given a program node with an account that uses a defined type link.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'value', type: definedTypeLinkNode('myType') }),
                ]),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u64') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap the defined types.
    const result = visit(node, unwrapDefinedTypesVisitor(['myType']));

    // Then we expect the link to be replaced and the defined type to be removed.
    expect(result).toStrictEqual(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u64') })]),
                    identifier: 'myAccount',
                }),
            ],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});

test('it follows linked nodes using the correct paths', () => {
    // Given two link nodes designed so that the path would
    // fail if we did not save and restored linked paths.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'typeA',
                type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
            }),
        ],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'typeB1', type: definedTypeLinkNode('typeB2') }),
            definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('u64') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, { additionalPrograms: [programB] });

    // When we unwrap the defined types in programB.
    const result = visit(root, unwrapDefinedTypesVisitor(['typeB1', 'typeB2']));

    // Then we expect the final linkable to be resolved in programA.
    assertIsNode(result, 'rootNode');
    expect((result.program.definedTypes ?? [])[0]).toStrictEqual(
        definedTypeNode({ identifier: 'typeA', type: integerTypeNode('u64') }),
    );
});

test('it does not unwrap types from the wrong programs', () => {
    // Given a program node with a defined type used in another type.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') }),
            definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        identifier: 'programA',
        publicKey: '1111',
    });

    // And another program with a defined type sharing the same name.
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') }),
            definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we unwrap the defined type from programA.
    const node = rootNode(programA, { additionalPrograms: [programB] });
    const result = visit(node, unwrapDefinedTypesVisitor(['programA.myType']));

    // Then we expect programA to have been modified but not programB.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                definedTypes: [definedTypeNode({ identifier: 'myCopyType', type: integerTypeNode('u8') })],
                identifier: 'programA',
                publicKey: '1111',
            }),
            { additionalPrograms: [programB] },
        ),
    );
});

test('it matches type identifiers exactly', () => {
    // Given a snake_case defined type used by an account.
    const node = programNode({
        accounts: [accountNode({ data: definedTypeLinkNode('my_type'), identifier: 'myAccount' })],
        definedTypes: [definedTypeNode({ identifier: 'my_type', type: integerTypeNode('u64') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap it using a different casing, then nothing changes.
    expect(visit(node, unwrapDefinedTypesVisitor(['myType']))).toStrictEqual(node);

    // When we unwrap it using its exact identifier, then it is inlined.
    const result = visit(node, unwrapDefinedTypesVisitor(['my_type']));
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0].data).toStrictEqual(integerTypeNode('u64'));
});

test('it layers the transforms of the link on top of the inlined type', () => {
    // Given a link with transforms pointing to a type that has its own transforms.
    const node = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('myString', { transforms: [fixedSizeTransformNode(64)] }),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                identifier: 'myString',
                type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
            }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap the defined type.
    const result = visit(node, unwrapDefinedTypesVisitor(['myString']));

    // Then we expect the type's transforms to stay innermost and the link's to be appended.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0].data).toStrictEqual(
        stringTypeNode('utf8', {
            transforms: [sizePrefixTransformNode(integerTypeNode('u32')), fixedSizeTransformNode(64)],
        }),
    );
});

test('it unwraps links inside PDAs, events and constants', () => {
    // Given a defined type used by a PDA seed, an event and a constant.
    const node = programNode({
        constants: [constantNode('myConstant', definedTypeLinkNode('myType'), integerValueNode('1'))],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') })],
        events: [eventNode({ data: definedTypeLinkNode('myType'), identifier: 'myEvent' })],
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'myPda', seeds: [variablePdaSeedNode('seed', definedTypeLinkNode('myType'))] })],
        publicKey: '1111',
    });

    // When we unwrap the defined type.
    const result = visit(node, unwrapDefinedTypesVisitor(['myType']));

    // Then we expect every link to be replaced, leaving none dangling.
    expect(result).toStrictEqual(
        programNode({
            constants: [constantNode('myConstant', integerTypeNode('u16'), integerValueNode('1'))],
            events: [eventNode({ data: integerTypeNode('u16'), identifier: 'myEvent' })],
            identifier: 'myProgram',
            pdas: [pdaNode({ identifier: 'myPda', seeds: [variablePdaSeedNode('seed', integerTypeNode('u16'))] })],
            publicKey: '1111',
        }),
    );
});

test('it qualifies links inside types inlined into another program', () => {
    // Given programA using a type from programB that links to another type of programB.
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
            definedTypeNode({
                identifier: 'wrapper',
                type: structTypeNode([
                    structFieldTypeNode({ identifier: 'inner', type: definedTypeLinkNode('inner') }),
                ]),
            }),
            definedTypeNode({ identifier: 'inner', type: integerTypeNode('u8') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we only unwrap the outer type.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        unwrapDefinedTypesVisitor(['programB.wrapper']),
    );

    // Then the inner link now explicitly points to programB.
    assertIsNode(result, 'rootNode');
    expect(result.program.accounts?.[0].data).toStrictEqual(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'inner',
                type: definedTypeLinkNode('inner', { program: programLinkNode('programB') }),
            }),
        ]),
    );
});

test('it keeps cyclic defined types and the links to them', () => {
    // Given a linked list used by an account, next to a plain alias.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'value', type: definedTypeLinkNode('amount') }),
            structFieldTypeNode({
                identifier: 'next',
                type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
            }),
        ]),
    });
    const node = programNode({
        accounts: [accountNode({ data: definedTypeLinkNode('list'), identifier: 'myAccount' })],
        definedTypes: [list, definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap every defined type.
    const result = visit(node, unwrapDefinedTypesVisitor('*'));

    // Then only the alias is inlined, including within the kept cyclic type.
    expect(result).toStrictEqual(
        programNode({
            accounts: [accountNode({ data: definedTypeLinkNode('list'), identifier: 'myAccount' })],
            definedTypes: [
                definedTypeNode({
                    identifier: 'list',
                    type: structTypeNode([
                        structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u64') }),
                        structFieldTypeNode({
                            identifier: 'next',
                            type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
                        }),
                    ]),
                }),
            ],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});

test('it keeps defined types in a cycle made only of types to inline', () => {
    // Given two types linking to each other.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'a', type: arrayTypeNode(definedTypeLinkNode('b'), remainderCountNode()) }),
            definedTypeNode({ identifier: 'b', type: arrayTypeNode(definedTypeLinkNode('a'), remainderCountNode()) }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap both of them, then nothing changes.
    expect(visit(node, unwrapDefinedTypesVisitor(['a', 'b']))).toStrictEqual(node);
});

test('it inlines defined types in a cycle going through a type not to inline', () => {
    // Given two types linking to each other.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'a', type: arrayTypeNode(definedTypeLinkNode('b'), remainderCountNode()) }),
            definedTypeNode({ identifier: 'b', type: arrayTypeNode(definedTypeLinkNode('a'), remainderCountNode()) }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we unwrap one of them.
    const result = visit(node, unwrapDefinedTypesVisitor(['a']));

    // Then it is inlined, and the cycle ends at the link to the other one.
    expect(result).toStrictEqual(
        programNode({
            definedTypes: [
                definedTypeNode({
                    identifier: 'b',
                    type: arrayTypeNode(
                        arrayTypeNode(definedTypeLinkNode('b'), remainderCountNode()),
                        remainderCountNode(),
                    ),
                }),
            ],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
});
