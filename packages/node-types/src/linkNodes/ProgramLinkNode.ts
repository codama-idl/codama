import type { ImportFrom, MainCaseString } from '../shared';

export interface ProgramLinkNode {
    readonly kind: 'programLinkNode';

    // Data.
    readonly name: MainCaseString;
    readonly importFrom?: ImportFrom;
}
