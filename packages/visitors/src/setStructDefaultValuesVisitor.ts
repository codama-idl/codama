import { assertIsNode, StructFieldTypeNode, structFieldTypeNode, structTypeNode, ValueNode } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

type StructDefaultValueMap = Record<string, Record<string, StructDefaultValue>>;
type StructDefaultValue = ValueNode | { strategy?: 'omitted' | 'optional'; value: ValueNode } | null;

/**
 * Set, override or remove (`null`) the default values of struct fields.
 *
 * Keys of the outer map select the nodes whose structs are updated (e.g. a
 * defined type, an account or an instruction, whose inline `data` struct is
 * matched too). Keys of the inner map are field identifiers, matched
 * exactly.
 *
 * Contextual defaults for instruction data (e.g. an account's bump) are
 * expressed with an `injectedValueNode` and a matching entry in the
 * instruction's `provides`.
 *
 * @example
 * ```ts
 * setStructDefaultValuesVisitor({
 *     myAccount: { count: integerValueNode('0') },
 *     transfer: { amount: { strategy: 'optional', value: integerValueNode('1') }, memo: null },
 * });
 * ```
 */
export function setStructDefaultValuesVisitor(map: StructDefaultValueMap) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(([stack, defaultValues]): BottomUpNodeTransformerWithSelector => {
            const defaultValuesByField = new Map(Object.entries(defaultValues));
            return {
                select: `${stack}.[structTypeNode]`,
                transform: node => {
                    assertIsNode(node, 'structTypeNode');
                    const fields = (node.fields ?? []).map((field): StructFieldTypeNode => {
                        const defaultValue = defaultValuesByField.get(field.identifier);
                        if (defaultValue === undefined) return field;
                        if (defaultValue === null) {
                            return structFieldTypeNode({
                                ...field,
                                defaultValue: undefined,
                                defaultValueStrategy: undefined,
                            });
                        }
                        return structFieldTypeNode({
                            ...field,
                            defaultValue: 'kind' in defaultValue ? defaultValue : defaultValue.value,
                            defaultValueStrategy: 'kind' in defaultValue ? undefined : defaultValue.strategy,
                        });
                    });
                    return structTypeNode(fields, { ...node });
                },
            };
        }),
    );
}
