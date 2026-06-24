import type { CamelCaseString } from '../../brands';

/**
 * Refers to a field of a named account's decoded data.
 * The referenced account must carry an `accountLink` so the account's layout is known.
 * Resolving the value requires reading the account state at presentation time.
 */
export interface AccountFieldValueNode {
    readonly kind: 'accountFieldValueNode';

    // Data.
    /** The name of the referenced account in the surrounding instruction. */
    readonly account: CamelCaseString;
    /**
     * The name of the field within the account's decoded data.
     * When absent, the value is the whole decoded account data.
     */
    readonly path?: CamelCaseString;
}
