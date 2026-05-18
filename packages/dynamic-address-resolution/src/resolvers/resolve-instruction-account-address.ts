import { CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, CodamaError } from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { InstructionAccountNode, InstructionNode, RootNode } from 'codama';

import { toAddress } from '../shared/address';
import type { AccountsInput, ArgumentsInput, ResolverFnInput, ResolversInput } from '../shared/types';
import { resolveAccountAddress } from './resolve-account-address';

export type ResolveInstructionAccountAddressInput<
    TAccounts extends AccountsInput = AccountsInput,
    TArgs extends ArgumentsInput = ArgumentsInput,
    TResolvers extends ResolverFnInput = ResolversInput,
> = {
    accountsInput?: TAccounts;
    argumentsInput?: TArgs;
    ixAccountNode: InstructionAccountNode;
    ixNode: InstructionNode;
    resolversInput?: TResolvers;
    root: RootNode;
};

export async function resolveInstructionAccountAddress<
    TAccounts extends AccountsInput = AccountsInput,
    TArgs extends ArgumentsInput = ArgumentsInput,
    TResolvers extends ResolverFnInput = ResolversInput,
>({
    accountsInput,
    argumentsInput,
    ixAccountNode,
    ixNode,
    resolversInput,
    root,
}: ResolveInstructionAccountAddressInput<TAccounts, TArgs, TResolvers>): Promise<Address | null> {
    const accountAddressInput = accountsInput?.[ixAccountNode.name];
    const isAccountProvided = accountAddressInput !== undefined && accountAddressInput !== null;

    // Accounts values (with default or with optionalAccountStrategy) can be omitted, as they are auto-resolved.
    // [AccountStatus + HasDefaultValue + UserInput]:
    // - Required + no default + undefined: throws.
    // - Required + no default + null: throws.
    // - Required + default + undefined: resolves from default value.
    // - Required + default + null: resolves from default value.
    // - Optional + no default + undefined: throws.
    // - Optional + no default + null: resolves from optionalAccountStrategy (programId or omitted).
    // - Optional + default + undefined: resolves from default value.
    // - Optional + default + null: resolves from optionalAccountStrategy (programId or omitted).
    const canAutoResolve = !!ixAccountNode.defaultValue || (ixAccountNode.isOptional && accountAddressInput === null);

    if (!isAccountProvided && !canAutoResolve) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
            accountName: ixAccountNode.name,
            instructionName: ixNode.name,
        });
    }

    if (isAccountProvided) {
        return toAddress(accountAddressInput);
    }

    return await resolveAccountAddress({
        accountsInput,
        argumentsInput,
        ixAccountNode,
        ixNode,
        resolutionPath: [],
        resolversInput,
        root,
    });
}
