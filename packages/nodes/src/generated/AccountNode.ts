import type {
    AccountNode,
    DiscriminatorNode,
    PdaLinkNode,
    PluginNode,
    StructTypeNode,
    TextNode,
    TypeNode,
} from '@codama/node-types';

import { identifierString } from '../shared';
import { structTypeNode } from './typeNodes/StructTypeNode';

export type AccountNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TData extends TypeNode = TypeNode,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<Partial<AccountNode<TDocs, TData, TPda, TDiscriminators, TPlugins>>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/**
 * An on-chain account: its identifier, data type, optional fixed size, optional PDA, and optional discriminators.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/77974dad-212e-49b1-8e41-5d466c273a02)
 */
export function accountNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TData extends TypeNode = StructTypeNode<[]>,
    const TPda extends PdaLinkNode | undefined = undefined,
    const TDiscriminators extends Array<DiscriminatorNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: AccountNodeInput<TDocs, TData, TPda, TDiscriminators, TPlugins>,
): AccountNode<TDocs, TData, TPda, TDiscriminators, TPlugins> {
    return Object.freeze({
        kind: 'accountNode',

        // Data.
        identifier: identifierString(input.identifier),
        ...(input.size !== undefined && { size: input.size }),

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        data: (input.data ?? structTypeNode([])) as TData,
        ...(input.pda !== undefined && { pda: input.pda }),
        ...(input.discriminators !== undefined &&
            input.discriminators.length > 0 && { discriminators: input.discriminators as TDiscriminators }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
