import type { CamelCaseString, ImportFrom } from '../shared';

export interface AccountLinkNode {
    readonly kind: 'accountLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
}
