import type { CamelCaseString } from '../shared';
import type { ProgramLinkNode } from './ProgramLinkNode';

export interface DefinedTypeLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'definedTypeLinkNode';

    // Children.
    readonly program?: TProgram;

    // Data.
    readonly name: CamelCaseString;
}
