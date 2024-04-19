import type { MainCaseString } from '../shared';

export interface ArgumentValueNode {
    readonly kind: 'argumentValueNode';

    // Data.
    readonly name: MainCaseString;
}
