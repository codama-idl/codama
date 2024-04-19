import type { MainCaseString } from '../shared';

export interface AccountBumpValueNode {
    readonly kind: 'accountBumpValueNode';

    // Data.
    readonly name: MainCaseString;
}
