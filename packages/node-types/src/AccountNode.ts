import type { DiscriminatorNode } from './discriminatorNodes';
import type { PdaLinkNode } from './linkNodes';
import type { CamelCaseString, Docs } from './shared';
import type { NestedTypeNode, StructTypeNode } from './typeNodes';

export interface AccountNode<
    TData extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
    TPda extends PdaLinkNode | undefined = PdaLinkNode | undefined,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
> {
    readonly kind: 'accountNode';

    // Data.
    readonly name: CamelCaseString;
    readonly size?: number | null;
    readonly docs?: Docs;

    // Children.
    readonly data: TData;
    readonly pda?: TPda;
    readonly discriminators?: TDiscriminators;
}
