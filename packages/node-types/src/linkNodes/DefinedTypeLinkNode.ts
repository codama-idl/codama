import type { ImportFrom, CamelCaseString } from '../shared';

export interface DefinedTypeLinkNode {
    readonly kind: 'definedTypeLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
