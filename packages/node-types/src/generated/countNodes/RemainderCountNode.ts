/** A count strategy where items are read until the buffer is exhausted. */
export interface RemainderCountNode {
    readonly kind: 'remainderCountNode';
}
