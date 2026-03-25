import type { InstructionNode } from 'codama';
import { assert, StructError } from 'superstruct';

import { AccountError } from '../../shared/errors';
import type { AccountsInput } from '../../shared/types';
import { safeStringify } from '../../shared/util';
import { createIxAccountsValidator } from '../validators';

/**
 * Creates a validation function for InstructionAccountNodes.
 * Pre-built superstruct validator ensures all required accounts are provided and have valid addresses.
 * Skips validation for instructions without accounts.
 */
export function createAccountsInputValidator(ixNode: InstructionNode) {
    const validator = ixNode.accounts.length ? createIxAccountsValidator(ixNode.accounts) : null;

    return (accountsInput: AccountsInput = {}) => {
        if (!validator) return;

        try {
            assert(accountsInput, validator);
        } catch (error) {
            if (error instanceof StructError) {
                const key = error.key as string;
                const value = error.value as unknown;
                if (value == null) {
                    throw new AccountError(`Missing required account: ${key}. Expected a valid Solana address`);
                } else {
                    throw new AccountError(`Invalid address of "${key}" account: ${safeStringify(value)}`);
                }
            }
            throw new AccountError(`Unexpected account validation error`, { cause: error });
        }
    };
}
