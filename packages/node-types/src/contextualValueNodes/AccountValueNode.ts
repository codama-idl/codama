import type { CamelCaseString } from '../shared';

export interface AccountValueNode {
    readonly kind: 'accountValueNode';

    // Data.
    readonly name: CamelCaseString;
}
