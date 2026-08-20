import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';

/**
 * A program error — a numeric code paired with a name and human-readable message.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0bde98ea-0327-404b-bf38-137d105826b0)
 */
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
