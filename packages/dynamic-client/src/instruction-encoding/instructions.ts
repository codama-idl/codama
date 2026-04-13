import { address } from '@solana/addresses';
import type { InstructionNode, RootNode } from 'codama';

import type { BuildIxFn } from '../shared/types';
import { createAccountMeta, createAccountsInputValidator } from './accounts';
import {
    createArgumentsInputValidator,
    encodeInstructionArguments,
    resolveArgumentDefaultsFromCustomResolvers,
} from './arguments';

/**
 * Creates an instruction builder for a given InstructionNode.
 */
export function createIxBuilder(root: RootNode, ixNode: InstructionNode): BuildIxFn {
    const programAddress = address(root.program.publicKey);
    const validateArguments = createArgumentsInputValidator(root, ixNode);
    const validateAccounts = createAccountsInputValidator(ixNode);

    return async (argumentsInput, accountsInput, signers, resolversInput) => {
        // Validate arguments according to Codama schema.
        validateArguments(argumentsInput);

        // Ensure required accounts are present and validate provided pubkey addresses.
        validateAccounts(accountsInput);

        // Resolve arguments that depend on custom resolvers.
        const enrichedArgumentsInput = await resolveArgumentDefaultsFromCustomResolvers(
            ixNode,
            argumentsInput,
            accountsInput,
            resolversInput,
        );

        // Encode arguments into buffer.
        const argumentsData = encodeInstructionArguments(root, ixNode, enrichedArgumentsInput);

        const accountsData = await createAccountMeta(
            root,
            ixNode,
            enrichedArgumentsInput,
            accountsInput,
            signers,
            resolversInput,
        );

        return {
            accounts: accountsData,
            data: argumentsData,
            programAddress,
        };
    };
}
