import type { Address } from '@solana/addresses';
import type { InstructionAccountNode, InstructionNode, RootNode } from 'codama';
import { visitOrElse } from 'codama';

import { type AddressInput, toAddress } from '../../shared/address';
import { AccountError } from '../../shared/errors';
import { createAccountDefaultValueVisitor } from '../visitors/account-default-value';
import type { BaseResolutionContext } from './types';

type ResolveAccountAddressContext = BaseResolutionContext & {
    accountAddressInput?: AddressInput | null | undefined;
    ixAccountNode: InstructionAccountNode;
};

/**
 * Resolves the address of an instruction account node via either defaultValue or optionalAccountStrategy.
 */
export async function resolveAccountAddress({
    root,
    ixNode,
    ixAccountNode,
    argumentsInput,
    accountsInput,
    resolutionPath,
    resolversInput,
    accountAddressInput,
}: ResolveAccountAddressContext): Promise<Address | null> {
    // Optional accounts explicitly provided as null should be resolved based on optionalAccountStrategy
    if (accountAddressInput === null && ixAccountNode.isOptional) {
        return resolveOptionalAccountWithStrategy(root, ixNode, ixAccountNode);
    }

    if (ixAccountNode.defaultValue) {
        const visitor = createAccountDefaultValueVisitor({
            accountAddressInput,
            accountsInput,
            argumentsInput,
            ixAccountNode,
            ixNode,
            resolutionPath,
            resolversInput,
            root,
        });

        const addressValue = await visitOrElse(ixAccountNode.defaultValue, visitor, node => {
            throw new AccountError(
                `Cannot resolve account ${ixAccountNode.name}:${node.kind} of ${ixNode.name} instruction`,
            );
        });

        // conditionalValueNode with ifFalse branch returns null.
        // This should be resolved via optionalAccountStrategy for optional accounts.
        if (addressValue === null && ixAccountNode.isOptional) {
            return resolveOptionalAccountWithStrategy(root, ixNode, ixAccountNode);
        }

        return addressValue;
    }

    throw new AccountError(
        `Cannot resolve account ${ixAccountNode.name} of ${ixNode.name} instruction. Account doesn't have default value or was not provided`,
    );
}

/**
 * Optional account resolution via instruction strategy.
 * With "programId" strategy, optional accounts are resolved to programId.
 * With "omitted" strategy, optional accounts must be excluded from accounts list.
 */
function resolveOptionalAccountWithStrategy(
    root: RootNode,
    ixNode: InstructionNode,
    ixAccountNode: InstructionAccountNode,
) {
    if (!ixAccountNode.isOptional) {
        throw new AccountError(
            `Account ${ixAccountNode.name} of ${ixNode.name} instruction is not optional, cannot apply optional account strategy`,
        );
    }
    switch (ixNode.optionalAccountStrategy) {
        case 'omitted':
            return null;
        case 'programId':
            return toAddress(root.program.publicKey);
        default:
            throw new AccountError(
                `Cannot resolve optional account: ${ixAccountNode.name} of ${ixNode.name} instruction with strategy: ${String(ixNode.optionalAccountStrategy)}`,
            );
    }
}
