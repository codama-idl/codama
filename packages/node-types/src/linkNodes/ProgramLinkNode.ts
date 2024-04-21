import type { CamelCaseString, ImportFrom } from '../shared';

export interface ProgramLinkNode {
    readonly kind: 'programLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
