import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';

/** A program error — a numeric code paired with a name and human-readable message. */
export interface ErrorNode {
    readonly kind: 'errorNode';

    // Data.
    /** The name of the error. */
    readonly name: CamelCaseString;
    /** The numeric error code returned by the program. */
    readonly code: number;
    /** A human-readable description of the error. */
    readonly message: string;
    /** Markdown documentation for the error. */
    readonly docs?: Docs;
}
