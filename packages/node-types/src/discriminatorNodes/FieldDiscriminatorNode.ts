import type { MainCaseString } from '../shared';

export interface FieldDiscriminatorNode {
    readonly kind: 'fieldDiscriminatorNode';

    // Data.
    readonly name: MainCaseString;
    readonly offset: number;
}
