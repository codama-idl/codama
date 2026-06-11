import type { PreOffsetStrategy } from '../shared/preOffsetStrategy';
import type { TypeNode } from './TypeNode';

/** Before serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy. */
export interface PreOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'preOffsetTypeNode';

    // Data.
    /** The signed byte offset to apply before the wrapped type runs. */
    readonly offset: number;
    /** How the `offset` value is interpreted. */
    readonly strategy: PreOffsetStrategy;

    // Children.
    /** The wrapped type whose serialisation is preceded by the offset. */
    readonly type: TType;
}
