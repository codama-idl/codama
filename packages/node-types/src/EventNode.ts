import type { DiscriminatorNode } from './discriminatorNodes';
import type { CamelCaseString, Docs } from './shared';
import type { TypeNode } from './typeNodes';

export interface EventNode<
    TData extends TypeNode = TypeNode,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
> {
    readonly kind: 'eventNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;

    // Children.
    readonly data: TData;
    readonly discriminators?: TDiscriminators;
}
