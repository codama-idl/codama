import type { CamelCaseString } from '../shared';

export interface PdaLinkNode {
    readonly kind: 'pdaLinkNode';

    // Data.
    readonly name: CamelCaseString;
}
