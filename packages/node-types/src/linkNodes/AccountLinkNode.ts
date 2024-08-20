import type { CamelCaseString } from '../shared';
import type { ProgramLinkNode } from './ProgramLinkNode';

export interface AccountLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'accountLinkNode';

    // Children.
    readonly program?: TProgram;

    // Data.
    readonly name: CamelCaseString;
}
