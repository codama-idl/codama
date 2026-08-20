/**
 * How a post-offset modifier interprets its offset value after serialising the wrapped type.
 * See `postOffsetTypeNode` for an illustrated walkthrough of each strategy.
 */
export type PostOffsetStrategy =
    /** Move the cursor to the absolute byte position given by the offset; a negative offset counts backwards from the end of the buffer. */
    | 'absolute'
    /** Move the cursor like `relative` while growing the buffer by the offset amount; a negative offset moves the cursor backwards and shrinks the buffer. */
    | 'padded'
    /** Move the cursor by the offset bytes relative to the pre-offset — where the wrapped type started — rather than where it ended; a negative offset moves it to the left of that position. */
    | 'preOffset'
    /** Advance the cursor by the offset bytes relative to its current position; a negative offset moves it backwards. */
    | 'relative';
