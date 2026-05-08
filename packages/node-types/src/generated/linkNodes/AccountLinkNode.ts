import type { CamelCaseString } from '../../brands';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** A reference to an account defined elsewhere — possibly in a different program. */
export interface AccountLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'accountLinkNode';

    // Data.
    /** The name of the referenced account. */
    readonly name: CamelCaseString;

    // Children.
    /** The program the referenced account belongs to. When omitted, the surrounding program is assumed. */
    readonly program?: TProgram;
}
