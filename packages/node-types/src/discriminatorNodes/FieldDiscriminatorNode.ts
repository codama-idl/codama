import type { CamelCaseString } from '../shared';

export interface FieldDiscriminatorNode {
    readonly kind: 'fieldDiscriminatorNode';

    // Data.
    readonly name: CamelCaseString;
    readonly offset: number;
}
