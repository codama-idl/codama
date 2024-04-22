import type { CamelCaseString, ImportFrom } from '../shared';

export interface PdaLinkNode {
    readonly kind: 'pdaLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
