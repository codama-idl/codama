import type { ImportFrom, MainCaseString } from '../shared';

export interface AccountLinkNode {
    readonly kind: 'accountLinkNode';

    // Data.
    readonly name: MainCaseString;
    readonly importFrom?: ImportFrom;
}
