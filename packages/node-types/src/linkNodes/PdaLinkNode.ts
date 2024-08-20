import type { CamelCaseString } from '../shared';
import type { ProgramLinkNode } from './ProgramLinkNode';

export interface PdaLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'pdaLinkNode';

    // Children.
    readonly program?: TProgram;

    // Data.
    readonly name: CamelCaseString;
}
