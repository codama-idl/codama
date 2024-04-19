import type { ImportFrom, MainCaseString } from '../shared';

export interface PdaLinkNode {
    readonly kind: 'pdaLinkNode';

    // Data.
    readonly name: MainCaseString;
    readonly importFrom?: ImportFrom;
}
