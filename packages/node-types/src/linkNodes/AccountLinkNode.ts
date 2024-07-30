import type { CamelCaseString, ImportFrom } from '../shared';
import { ProgramLinkNode } from './ProgramLinkNode';

export interface AccountLinkNode <TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined>{
    readonly kind: 'accountLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
    readonly program?: TProgram;
}
