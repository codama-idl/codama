import {
    accountNode,
    assertIsNode,
    definedTypeLinkNode,
    definedTypeNode,
    fixedSizeTransformNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    noneValueNode,
    optionTypeNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { setStructDefaultValuesVisitor } from '../src';

test('it adds new default values to struct fields', () => {
    // Given the following person type with no default values.
    const node = definedTypeNode({
        identifier: 'person',
        type: structTypeNode([
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
            structFieldTypeNode({ identifier: 'dateOfBirth', type: optionTypeNode(integerTypeNode('i64')) }),
        ]),
    });

    // When we set default values for the age and dateOfBirth fields of the person type.
    const result = visit(
        node,
        setStructDefaultValuesVisitor({ person: { age: integerValueNode('42'), dateOfBirth: noneValueNode() } }),
    );

    // Then we expect the following tree changes.
    expect(result).toStrictEqual(
        definedTypeNode({
            identifier: 'person',
            type: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    identifier: 'age',
                    type: integerTypeNode('u32'),
                }),
                structFieldTypeNode({
                    defaultValue: noneValueNode(),
                    identifier: 'dateOfBirth',
                    type: optionTypeNode(integerTypeNode('i64')),
                }),
            ]),
        }),
    );
});

test('it adds new default values with custom strategies to struct fields', () => {
    // Given the following token account with no default values.
    const node = accountNode({
        data: structTypeNode([
            structFieldTypeNode({ identifier: 'discriminator', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'delegateAuthority', type: optionTypeNode(publicKeyTypeNode()) }),
        ]),
        identifier: 'token',
    });

    // When we set default values of that account with custom strategies.
    const result = visit(
        node,
        setStructDefaultValuesVisitor({
            token: {
                delegateAuthority: { strategy: 'optional', value: noneValueNode() },
                discriminator: { strategy: 'omitted', value: integerValueNode('42') },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'accountNode');
    assertIsNode(result.data, 'structTypeNode');
    const [discriminator, delegateAuthority] = result.data.fields ?? [];
    expect(discriminator.defaultValue).toStrictEqual(integerValueNode('42'));
    expect(discriminator.defaultValueStrategy).toBe('omitted');
    expect(delegateAuthority.defaultValue).toStrictEqual(noneValueNode());
    expect(delegateAuthority.defaultValueStrategy).toBe('optional');
});

test('it adds new default values to instruction data fields', () => {
    // Given an instruction with no default values for its data fields.
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({ identifier: 'discriminator', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
        ]),
        identifier: 'transferTokens',
    });

    // When we set default values for its data fields, including an injected one.
    const result = visit(
        node,
        setStructDefaultValuesVisitor({
            transferTokens: {
                amount: injectedValueNode({ fallback: integerValueNode('1'), key: 'amount' }),
                discriminator: { strategy: 'omitted', value: integerValueNode('42') },
            },
        }),
    );

    // Then we expect the following tree changes.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({
                    defaultValue: injectedValueNode({ fallback: integerValueNode('1'), key: 'amount' }),
                    identifier: 'amount',
                    type: integerTypeNode('u64'),
                }),
            ]),
            identifier: 'transferTokens',
        }),
    );
});

test('it removes default values and keeps the struct transforms', () => {
    // Given a fixed-size struct whose field has a default value.
    const node = definedTypeNode({
        identifier: 'config',
        type: structTypeNode(
            [
                structFieldTypeNode({
                    defaultValue: integerValueNode('1'),
                    defaultValueStrategy: 'optional',
                    identifier: 'version',
                    type: integerTypeNode('u8'),
                }),
            ],
            { transforms: [fixedSizeTransformNode(8)] },
        ),
    });

    // When we remove its default value.
    const result = visit(node, setStructDefaultValuesVisitor({ config: { version: null } }));

    // Then the default value is gone and the transforms are preserved.
    expect(result).toStrictEqual(
        definedTypeNode({
            identifier: 'config',
            type: structTypeNode([structFieldTypeNode({ identifier: 'version', type: integerTypeNode('u8') })], {
                transforms: [fixedSizeTransformNode(8)],
            }),
        }),
    );
});

test('it matches field identifiers exactly and does not follow links', () => {
    // Given an account with a snake_case field and an instruction with linked data.
    const account = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'max_supply', type: integerTypeNode('u64') })]),
        identifier: 'mint',
    });
    const instruction = instructionNode({ data: definedTypeLinkNode('transferArgs'), identifier: 'transfer' });

    // When we set default values using another casing or through the link, then nothing changes.
    expect(visit(account, setStructDefaultValuesVisitor({ mint: { maxSupply: integerValueNode('0') } }))).toStrictEqual(
        account,
    );
    expect(
        visit(instruction, setStructDefaultValuesVisitor({ transfer: { amount: integerValueNode('0') } })),
    ).toStrictEqual(instruction);
});
