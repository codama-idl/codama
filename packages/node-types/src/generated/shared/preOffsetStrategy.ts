/** How a pre-offset modifier interprets its offset value before serialising the wrapped type. */
export type PreOffsetStrategy =
    /** Move the cursor to the absolute byte position given by the offset. */
    | 'absolute'
    /** Pad with zero bytes from the current cursor up to the offset bytes ahead. */
    | 'padded'
    /** Advance the cursor by the offset bytes relative to its current position. */
    | 'relative';
