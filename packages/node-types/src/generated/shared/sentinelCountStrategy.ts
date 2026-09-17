/**
 * Whether the sentinel of a `sentinelCountNode` is written when encoding and required when decoding.
 * See `sentinelCountNode` for the decoding algorithm each strategy follows.
 */
export type SentinelCountStrategy =
    /** The sentinel is never written; when decoding, it is consumed if present and the collection also ends at the end of the buffer. Only meaningful when the collection is followed by unused space or the end of the buffer, since nothing else marks where it ends. */
    | 'omitted'
    /** The sentinel is written after the last item; when decoding, it is consumed if present and the collection also ends at the end of the buffer. Use this to tolerate tightly sized or legacy data that lacks the sentinel. */
    | 'optional'
    /** The sentinel is written after the last item and must be present when decoding; reaching the end of the buffer without it is an error. */
    | 'required';
