import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { InstructionAccountNode, InstructionNode, RootNode } from 'codama';
import { visitOrElse } from 'codama';

import { type AddressInput, toAddress } from '../../shared/address';
import { safeStringify } from '../../shared/util';
import {
    ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS,
    createAccountDefaultValueVisitor,
} from '../visitors/account-default-value';
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
            throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: [...ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS],
                kind: node.kind,
                node,
            });
        });

        // conditionalValueNode with ifFalse branch returns null.
        // This should be resolved via optionalAccountStrategy for optional accounts.
        if (addressValue === null && ixAccountNode.isOptional) {
            return resolveOptionalAccountWithStrategy(root, ixNode, ixAccountNode);
        }

        return addressValue;
    }

    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
        accountName: ixAccountNode.name,
        instructionName: ixNode.name,
    });
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
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `resolveOptionalAccountWithStrategy called for non-optional account: ${ixAccountNode.name}`,
        });
    }
    switch (ixNode.optionalAccountStrategy) {
        case 'omitted':
            return null;
        case 'programId':
            return toAddress(root.program.publicKey);
        default:
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY, {
                accountName: ixAccountNode.name,
                instructionName: ixNode.name,
                strategy: safeStringify(ixNode.optionalAccountStrategy),
            });
    }
}
