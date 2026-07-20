import type { AccountNode, DiscriminatorNode, NestedTypeNode, PdaLinkNode, StructTypeNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';
import { structTypeNode } from './typeNodes/StructTypeNode';

export type AccountNodeInput<
    TData extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
> = Omit<Partial<AccountNode<TData, TPda, TDiscriminators>>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** An on-chain account: its name, data structure, optional fixed size, optional PDA, and optional discriminators. */
export function accountNode<
    const TData extends NestedTypeNode<StructTypeNode> = StructTypeNode<[]>,
    const TPda extends PdaLinkNode | undefined = undefined,
    const TDiscriminators extends Array<DiscriminatorNode> | undefined = undefined,
>(input: AccountNodeInput<TData, TPda, TDiscriminators>): AccountNode<TData, TPda, TDiscriminators> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'accountNode',

        // Data.
        name: camelCase(input.name),
        ...(input.size !== undefined && { size: input.size }),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        data: (input.data ?? structTypeNode([])) as TData,
        ...(input.pda !== undefined && { pda: input.pda }),
        ...(input.discriminators !== undefined &&
            input.discriminators.length > 0 && { discriminators: input.discriminators as TDiscriminators }),
    });
}
