import type { CamelCaseString } from '../shared';

export interface DefinedTypeLinkNode {
    readonly kind: 'definedTypeLinkNode';

    // Data.
    readonly name: CamelCaseString;
}
