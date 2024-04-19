import type { MainCaseString } from '../shared';

export interface AccountValueNode {
    readonly kind: 'accountValueNode';

    // Data.
    readonly name: MainCaseString;
}
