import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { DiscriminatorNode } from './discriminatorNodes/DiscriminatorNode';
import type { TypeNode } from './typeNodes/TypeNode';

/** A program event: its data shape and optional discriminators used to identify it on the wire. */
export interface EventNode<
    TData extends TypeNode = TypeNode,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
> {
    readonly kind: 'eventNode';

    // Data.
    /** The name of the event. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the event. */
    readonly docs?: Docs;

    // Children.
    /** The type describing the event payload. */
    readonly data: TData;
    /** Discriminators that distinguish this event from others. When multiple are listed, they are combined with a logical AND. */
    readonly discriminators?: TDiscriminators;
}
