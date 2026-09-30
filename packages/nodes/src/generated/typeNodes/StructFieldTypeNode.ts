import type {
    PluginNode,
    StructFieldDisplayNode,
    StructFieldTypeNode,
    TextNode,
    TypeNode,
    ValueNode,
} from '@codama/node-types';

import { identifierString } from '../../shared';

export type StructFieldTypeNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
    TDisplay extends StructFieldDisplayNode | undefined = StructFieldDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<StructFieldTypeNode<TDocs, TType, TDefaultValue, TDisplay, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/** A named field within a struct type. */
export function structFieldTypeNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
    const TDefaultValue extends ValueNode | undefined = undefined,
    const TDisplay extends StructFieldDisplayNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: StructFieldTypeNodeInput<TDocs, TType, TDefaultValue, TDisplay, TPlugins>,
): StructFieldTypeNode<TDocs, TType, TDefaultValue, TDisplay, TPlugins> {
    return Object.freeze({
        kind: 'structFieldTypeNode',

        // Data.
        identifier: identifierString(input.identifier),
        ...(input.defaultValueStrategy !== undefined && { defaultValueStrategy: input.defaultValueStrategy }),

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        type: input.type,
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
        ...(input.display !== undefined && { display: input.display }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
