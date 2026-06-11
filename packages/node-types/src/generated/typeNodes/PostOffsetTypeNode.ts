import type { PostOffsetStrategy } from '../shared/postOffsetStrategy';
import type { TypeNode } from './TypeNode';

/** After serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy. */
export interface PostOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'postOffsetTypeNode';

    // Data.
    /** The signed byte offset to apply after the wrapped type runs. */
    readonly offset: number;
    /** How the `offset` value is interpreted. */
    readonly strategy: PostOffsetStrategy;

    // Children.
    /** The wrapped type whose serialisation is followed by the offset. */
    readonly type: TType;
}
