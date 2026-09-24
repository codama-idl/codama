import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import {
    accountNode,
    definedTypeLinkNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    identifierString,
    integerTypeNode,
    integerValueNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { setAccountDiscriminatorFromFieldVisitor } from '../src';

test('it uses a data field as the account discriminator', () => {
    // Given a fixed-size account with a "key" field and an existing discriminator.
    const node = accountNode({
        data: structTypeNode(
            [
                structFieldTypeNode({ identifier: 'key', type: integerTypeNode('u8') }),
                structFieldTypeNode({ identifier: 'count', type: integerTypeNode('u64') }),
            ],
            { transforms: [fixedSizeTransformNode(16)] },
        ),
        discriminators: [sizeDiscriminatorNode(16)],
        identifier: 'myAccount',
    });

    // When we use the "key" field as its discriminator.
    const result = visit(
        node,
        setAccountDiscriminatorFromFieldVisitor({
            myAccount: { field: 'key', offset: 0, value: integerValueNode('3') },
        }),
    );

    // Then the field gets an omitted default value, the discriminator is prepended and the transforms are kept.
    expect(result).toStrictEqual(
        accountNode({
            data: structTypeNode(
                [
                    structFieldTypeNode({
                        defaultValue: integerValueNode('3'),
                        defaultValueStrategy: 'omitted',
                        identifier: 'key',
                        type: integerTypeNode('u8'),
                    }),
                    structFieldTypeNode({ identifier: 'count', type: integerTypeNode('u64') }),
                ],
                { transforms: [fixedSizeTransformNode(16)] },
            ),
            discriminators: [fieldDiscriminatorNode('key', { offset: 0 }), sizeDiscriminatorNode(16)],
            identifier: 'myAccount',
        }),
    );
});

test('it throws when the field does not exist', () => {
    // Given an account without a "key" field.
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'count', type: integerTypeNode('u64') })]),
        identifier: 'myAccount',
    });

    // When we try to use the "key" field as its discriminator, then we expect an error.
    expect(() =>
        visit(
            node,
            setAccountDiscriminatorFromFieldVisitor({ myAccount: { field: 'key', value: integerValueNode('3') } }),
        ),
    ).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {
            account: node,
            missingField: identifierString('key'),
            name: identifierString('myAccount'),
        }),
    );
});

test('it throws when the account data is linked', () => {
    // Given an account whose data links to a defined type.
    const node = accountNode({ data: definedTypeLinkNode('myData'), identifier: 'myAccount' });

    // When we try to set its discriminator from a field, then we expect an error.
    expect(() =>
        visit(
            node,
            setAccountDiscriminatorFromFieldVisitor({ myAccount: { field: 'key', value: integerValueNode('3') } }),
        ),
    ).toThrow(
        new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['structTypeNode'],
            kind: 'definedTypeLinkNode',
            node: node.data,
        }),
    );
});
