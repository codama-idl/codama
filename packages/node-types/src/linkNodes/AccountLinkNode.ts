import type { CamelCaseString } from '../shared';

export interface AccountLinkNode {
    readonly kind: 'accountLinkNode';

    // Data.
    readonly name: CamelCaseString;
}
