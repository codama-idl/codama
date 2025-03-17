import type { CamelCaseString, Docs } from './shared';

export interface ErrorNode {
    readonly kind: 'errorNode';

    // Data.
    readonly name: CamelCaseString;
    readonly code: number;
    readonly message: string;
    readonly docs?: Docs;
}
