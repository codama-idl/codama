import type { DefinedTypeNode, PluginNode, TextNode, TypeNode } from '@codama/node-types';

import { identifierString } from '../shared';

export type DefinedTypeNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TType extends TypeNode = TypeNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<DefinedTypeNode<TDocs, TType, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/**
 * A reusable named type that can be referenced by `definedTypeLinkNode` from elsewhere in the IDL.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/6049cf77-9a70-4915-8276-dd571d2f8828)
 */
export function definedTypeNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: DefinedTypeNodeInput<TDocs, TType, TPlugins>): DefinedTypeNode<TDocs, TType, TPlugins> {
    return Object.freeze({
        kind: 'definedTypeNode',

        // Data.
        identifier: identifierString(input.identifier),

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        type: input.type,
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
