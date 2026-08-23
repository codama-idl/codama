/**
 * Whether a member should be hidden from the fallback display list.
 * The interpolated sentence on `instructionDisplayNode` is governed separately — a member may be referenced there regardless of its skip value.
 */
export type DisplaySkip =
    /** The member is never shown in the fallback list. Use for purely structural fields like discriminators. */
    | 'always'
    /** The member is always shown in the fallback list. This is the default. */
    | 'never'
    /**
     * The member is shown only when its value was not already surfaced elsewhere through the provide/inject graph.
     * When the value was pulled via injection, the member is hidden as redundant; when nothing surfaced it, the member appears under its label as a backup.
     */
    | 'whenInjected';
