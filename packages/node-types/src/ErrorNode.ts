import type { MainCaseString } from './shared';

export interface ErrorNode {
    readonly kind: 'errorNode';

    // Data.
    readonly name: MainCaseString;
    readonly code: number;
    readonly message: string;
    readonly docs: string[];
}
