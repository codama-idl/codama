import type {
    AccountNode,
    DiscriminatorNode,
    NestedTypeNode,
    PdaLinkNode,
    StructTypeNode,
} from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';
import { structTypeNode } from './typeNodes';

export type AccountNodeInput<
    TData extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
> = Omit<AccountNode<TData, TPda, TDiscriminators>, 'data' | 'docs' | 'kind' | 'name'> & {
    readonly data?: TData;
    readonly docs?: DocsInput;
    readonly name: string;
};

export function accountNode<
    TData extends NestedTypeNode<StructTypeNode> = StructTypeNode<[]>,
    TPda extends PdaLinkNode | undefined = undefined,
    const TDiscriminators extends DiscriminatorNode[] | undefined = undefined,
>(input: AccountNodeInput<TData, TPda, TDiscriminators>): AccountNode<TData, TPda, TDiscriminators> {
    if (!input.name) {
        // TODO: Coded error.
        throw new Error('AccountNode must have a name.');
    }

    return Object.freeze({
        kind: 'accountNode',

        // Data.
        name: camelCase(input.name),
        ...(input.size === undefined ? {} : { size: input.size }),
        docs: parseDocs(input.docs),

        // Children.
        data: (input.data ?? structTypeNode([])) as TData,
        ...(input.pda !== undefined && { pda: input.pda }),
        ...(input.discriminators !== undefined && { discriminators: input.discriminators }),
    });
}
