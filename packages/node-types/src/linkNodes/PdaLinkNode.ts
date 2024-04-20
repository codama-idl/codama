import type { ImportFrom, CamelCaseString } from '../shared';

export interface PdaLinkNode {
    readonly kind: 'pdaLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
