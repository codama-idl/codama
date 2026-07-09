import type { AccountFieldValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

export type AccountFieldValueNodeInput = Omit<AccountFieldValueNode, 'account' | 'kind' | 'path'> & {
    readonly account: string;
    readonly path?: string;
};

/**
 * Refers to a field of a named account's decoded data.
 * The referenced account must carry an `accountLink` so the account's layout is known.
 * Resolving the value requires reading the account state at presentation time.
 */
export function accountFieldValueNode(input: AccountFieldValueNodeInput): AccountFieldValueNode {
    return Object.freeze({
        kind: 'accountFieldValueNode',

        // Data.
        account: camelCase(input.account),
        ...(input.path !== undefined && { path: camelCase(input.path) }),
    });
}
