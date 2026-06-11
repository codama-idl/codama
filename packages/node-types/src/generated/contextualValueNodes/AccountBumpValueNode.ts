import type { CamelCaseString } from '../../brands';

/** Refers to the bump seed of a named PDA-derived account in the surrounding instruction. */
export interface AccountBumpValueNode {
    readonly kind: 'accountBumpValueNode';

    // Data.
    /** The name of the account whose bump seed is referenced. */
    readonly name: CamelCaseString;
}
