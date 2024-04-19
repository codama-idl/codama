import type { ImportFrom, MainCaseString } from '../shared';

export interface DefinedTypeLinkNode {
    readonly kind: 'definedTypeLinkNode';

    // Data.
    readonly name: MainCaseString;
    readonly importFrom?: ImportFrom;
}
