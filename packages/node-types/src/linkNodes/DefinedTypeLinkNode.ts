import type { CamelCaseString, ImportFrom } from '../shared';

export interface DefinedTypeLinkNode {
    readonly kind: 'definedTypeLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
