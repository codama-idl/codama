import type { DiscriminatorNode, EventNode, NestedTypeNode, PdaLinkNode, StructTypeNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';
import { structTypeNode } from './typeNodes';

export type EventNodeInput<
    TData extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
> = Omit<EventNode<TData, TPda, TDiscriminators>, 'data' | 'docs' | 'kind' | 'name'> & {
    readonly data?: TData;
    readonly docs?: DocsInput;
    readonly name: string;
};

export function eventNode<
    TData extends NestedTypeNode<StructTypeNode> = StructTypeNode<[]>,
    TPda extends PdaLinkNode | undefined = undefined,
    const TDiscriminators extends DiscriminatorNode[] | undefined = undefined,
>(input: EventNodeInput<TData, TPda, TDiscriminators>): EventNode<TData, TPda, TDiscriminators> {
    return Object.freeze({
        kind: 'eventNode',

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
