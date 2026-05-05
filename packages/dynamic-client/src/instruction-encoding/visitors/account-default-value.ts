import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import type { Visitor } from 'codama';
import type {
    AccountBumpValueNode,
    AccountValueNode,
    ArgumentValueNode,
    ConditionalValueNode,
    IdentityValueNode,
    InstructionAccountNode,
    PayerValueNode,
    PdaValueNode,
    ProgramIdValueNode,
    PublicKeyValueNode,
    ResolverValueNode,
} from 'codama';
import { visitOrElse } from 'codama';

import type { AddressInput } from '../../shared/address';
import { isConvertibleAddress, toAddress } from '../../shared/address';
import { formatValueType, safeStringify } from '../../shared/util';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import { resolveConditionalValueNodeCondition } from '../resolvers/resolve-conditional';
import { resolvePDAAddress } from '../resolvers/resolve-pda-address';
import type { BaseResolutionContext } from '../resolvers/types';
import { formatArgumentPathSuffix, resolveArgumentPathValue } from './resolve-argument-path';

type AccountDefaultValueVisitorContext = BaseResolutionContext & {
    accountAddressInput: AddressInput | null | undefined;
    ixAccountNode: InstructionAccountNode;
};

export const ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS = [
    'accountBumpValueNode',
    'accountValueNode',
    'argumentValueNode',
    'conditionalValueNode',
    'identityValueNode',
    'payerValueNode',
    'pdaValueNode',
    'programIdValueNode',
    'publicKeyValueNode',
    'resolverValueNode',
] as const;

type AccountDefaultValueSupportedNodeKind = (typeof ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS)[number];

/**
 * Visitor for resolving InstructionInputValueNode types to Address values for account resolution.
 */
export function createAccountDefaultValueVisitor(
    ctx: AccountDefaultValueVisitorContext,
): Visitor<Promise<Address | null>, AccountDefaultValueSupportedNodeKind> {
    const {
        root,
        ixNode,
        ixAccountNode,
        accountAddressInput,
        argumentsInput,
        accountsInput,
        resolversInput,
        resolutionPath,
    } = ctx;

    return {
        visitAccountBumpValue: async (_node: AccountBumpValueNode) => {
            return await Promise.reject(
                new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, {
                    nodeKind: 'accountBumpValueNode',
                }),
            );
        },

        visitAccountValue: async (node: AccountValueNode) => {
            return await resolveAccountValueNodeAddress(node, {
                accountsInput,
                argumentsInput,
                ixNode,
                resolutionPath,
                resolversInput,
                root,
            });
        },

        visitArgumentValue: async (node: ArgumentValueNode) => {
            const rootArg = argumentsInput?.[node.name];
            const argValue =
                node.path && node.path.length > 0
                    ? resolveArgumentPathValue(rootArg, node.path, node.name, ixNode.name)
                    : rootArg;
            if (argValue === undefined || argValue === null) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING, {
                    argumentName: node.name,
                    argumentPath: formatArgumentPathSuffix(node.path ?? []),
                    instructionName: ixNode.name,
                });
            }

            if (!isConvertibleAddress(argValue)) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                    accountName: ixAccountNode.name,
                    actualType: formatValueType(argValue),
                    expectedType: 'Address | PublicKey',
                });
            }

            return await Promise.resolve(toAddress(argValue));
        },

        visitConditionalValue: async (conditionalValueNode: ConditionalValueNode) => {
            // ifTrue or ifFalse branch of ConditionalValueNode.
            const resolvedInputValueNode = await resolveConditionalValueNodeCondition({
                accountsInput,
                argumentsInput,
                conditionalValueNode,
                ixAccountNode,
                ixNode,
                resolutionPath,
                resolversInput,
                root,
            });

            if (resolvedInputValueNode === undefined) {
                // No matching branch (e.g. conditional with no ifFalse and falsy condition).
                // Return null to signal "unresolved" to apply optionalAccountStrategy.
                if (ixAccountNode.isOptional) {
                    return null;
                }
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                    accountName: ixAccountNode.name,
                    instructionName: ixNode.name,
                });
            }
            // Recursively resolve the chosen branch.
            const visitor = createAccountDefaultValueVisitor(ctx);
            const addressValue = await visitOrElse(resolvedInputValueNode, visitor, innerNode => {
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS],
                    kind: innerNode.kind,
                    node: innerNode,
                });
            });
            return addressValue;
        },

        visitIdentityValue: async (_node: IdentityValueNode) => {
            if (accountAddressInput === undefined || accountAddressInput === null) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                    accountName: ixAccountNode.name,
                    instructionName: ixNode.name,
                });
            }
            return await Promise.resolve(toAddress(accountAddressInput));
        },

        visitPayerValue: async (_node: PayerValueNode) => {
            if (accountAddressInput === undefined || accountAddressInput === null) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                    accountName: ixAccountNode.name,
                    instructionName: ixNode.name,
                });
            }
            return await Promise.resolve(toAddress(accountAddressInput));
        },

        visitPdaValue: async (node: PdaValueNode) => {
            const pda = await resolvePDAAddress({
                accountsInput,
                argumentsInput,
                ixNode,
                pdaValueNode: node,
                resolutionPath,
                resolversInput,
                root,
            });
            if (pda === null) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, {
                    accountName: ixAccountNode.name,
                });
            }
            return pda[0];
        },

        visitProgramIdValue: async (_node: ProgramIdValueNode) => {
            return await Promise.resolve(address(root.program.publicKey));
        },

        visitPublicKeyValue: async (node: PublicKeyValueNode) => {
            return await Promise.resolve(address(node.publicKey));
        },

        visitResolverValue: async (node: ResolverValueNode) => {
            const resolverFn = resolversInput?.[node.name];
            if (!resolverFn) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING, {
                    accountName: ixAccountNode.name,
                    resolverName: node.name,
                });
            }
            let result: unknown;
            try {
                result = await resolverFn(argumentsInput ?? {}, accountsInput ?? {});
            } catch (error) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER, {
                    cause: error,
                    resolverName: node.name,
                    targetKind: 'instructionAccountNode',
                    targetName: ixAccountNode.name,
                });
            }

            if (!isConvertibleAddress(result)) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS, {
                    accountName: ixAccountNode.name,
                    value: safeStringify(result),
                });
            }

            return toAddress(result);
        },
    };
}
