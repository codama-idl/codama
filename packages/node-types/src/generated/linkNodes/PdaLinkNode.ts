import type { CamelCaseString } from '../../brands';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** A reference to a PDA defined elsewhere — possibly in a different program. */
export interface PdaLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'pdaLinkNode';

    // Data.
    /** The name of the referenced PDA. */
    readonly name: CamelCaseString;

    // Children.
    /** The program the referenced PDA belongs to. When omitted, the surrounding program is assumed. */
    readonly program?: TProgram;
}
