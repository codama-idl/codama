import type { CamelCaseString } from '../shared';

export interface ArgumentValueNode {
    readonly kind: 'argumentValueNode';

    // Data.
    readonly name: CamelCaseString;
}
