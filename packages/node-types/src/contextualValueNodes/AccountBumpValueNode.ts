import type { CamelCaseString } from '../shared';

export interface AccountBumpValueNode {
    readonly kind: 'accountBumpValueNode';

    // Data.
    readonly name: CamelCaseString;
}
