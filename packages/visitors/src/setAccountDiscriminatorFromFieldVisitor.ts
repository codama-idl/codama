import { CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountNode,
    assertIsNode,
    fieldDiscriminatorNode,
    identifierString,
    structFieldTypeNode,
    structTypeNode,
    ValueNode,
} from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

/**
 * Use one of an account's data fields as its discriminator: the field's
 * default value is set to `value` (with the `omitted` strategy) and a
 * `fieldDiscriminatorNode` pointing to it is prepended to the account's
 * discriminators.
 *
 * The account's data must be an inline struct: linked data would change a
 * defined type that other nodes may share.
 *
 * @example
 * ```ts
 * setAccountDiscriminatorFromFieldVisitor({
 *     mint: { field: 'accountType', offset: 0, value: integerValueNode('1') },
 * });
 * ```
 */
export function setAccountDiscriminatorFromFieldVisitor(
    map: Record<string, { field: string; offset?: number; value: ValueNode }>,
) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(([selector, { field, value, offset }]): BottomUpNodeTransformerWithSelector => ({
            select: ['[accountNode]', selector],
            transform: node => {
                assertIsNode(node, 'accountNode');
                assertIsNode(node.data, 'structTypeNode');

                const accountFields = node.data.fields ?? [];
                const fieldIndex = accountFields.findIndex(f => f.identifier === field);
                if (fieldIndex < 0) {
                    throw new CodamaError(CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {
                        account: node,
                        missingField: identifierString(field),
                        name: node.identifier,
                    });
                }

                const fieldNode = accountFields[fieldIndex];
                return accountNode({
                    ...node,
                    data: structTypeNode(
                        [
                            ...accountFields.slice(0, fieldIndex),
                            structFieldTypeNode({ ...fieldNode, defaultValue: value, defaultValueStrategy: 'omitted' }),
                            ...accountFields.slice(fieldIndex + 1),
                        ],
                        { ...node.data },
                    ),
                    discriminators: [fieldDiscriminatorNode(field, { offset }), ...(node.discriminators ?? [])],
                });
            },
        })),
    );
}
