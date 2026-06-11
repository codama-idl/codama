/** How a post-offset modifier interprets its offset value after serialising the wrapped type. */
export type PostOffsetStrategy =
    /** Move the cursor to the absolute byte position given by the offset. */
    | 'absolute'
    /** Pad with zero bytes from the current cursor up to the offset bytes ahead. */
    | 'padded'
    /** Restore the cursor to where it was before the wrapped type ran (cancelling its pre-offset). */
    | 'preOffset'
    /** Advance the cursor by the offset bytes relative to its current position. */
    | 'relative';
