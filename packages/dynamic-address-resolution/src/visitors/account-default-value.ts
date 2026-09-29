import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import {
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionAccountNode,
    type Node,
    type Visitor,
    visitOrElse,
} from 'codama';

import { getInstruction, getProgramAddress, getRequiredDataValue } from '../resolvers/context';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import { resolveConditionalValueNodeCondition } from '../resolvers/resolve-conditional';
import { resolvePdaAddress } from '../resolvers/resolve-pda-address';
import type { ResolutionContext } from '../resolvers/types';
import { toAddress, toAddressOrThrow } from '../shared/address';

export const ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS = [
    'accountBumpValueNode',
    'accountDataValueNode',
    'accountValueNode',
    'conditionalValueNode',
    'dataValueNode',
    'identityValueNode',
    'injectedValueNode',
    'payerValueNode',
    'pdaValueNode',
    'programIdValueNode',
    'programLinkNode',
    'publicKeyValueNode',
] as const;

type AccountDefaultValueSupportedNodeKind = (typeof ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS)[number];

export function unexpectedAccountDefaultValueNode(node: Node): never {
    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: [...ACCOUNT_DEFAULT_VALUE_SUPPORTED_NODE_KINDS],
        kind: node.kind,
        node,
    });
}

/** Visitor resolving the default value of an instruction account to its address. */
export function createAccountDefaultValueVisitor(
    ixAccountNode: InstructionAccountNode,
    ctx: ResolutionContext,
): Visitor<Promise<Address | null>, AccountDefaultValueSupportedNodeKind> {
    const accountAddressInput = ctx.accountsInput?.[ixAccountNode.identifier];
    const requireProvidedAccount = () => {
        if (accountAddressInput === undefined || accountAddressInput === null) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                accountName: ixAccountNode.identifier,
                instructionName: getInstruction(ctx).identifier,
            });
        }
        return Promise.resolve(toAddress(accountAddressInput));
    };
    const unsupported = (nodeKind: AccountDefaultValueSupportedNodeKind) =>
        Promise.reject(new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { nodeKind }));

    const visitor: Visitor<Promise<Address | null>, AccountDefaultValueSupportedNodeKind> = {
        visitAccountBumpValue: () => unsupported('accountBumpValueNode'),

        // Resolving account data would require fetching the account.
        visitAccountDataValue: () => unsupported('accountDataValueNode'),

        visitAccountValue: async node => await resolveAccountValueNodeAddress(node, ctx),

        visitConditionalValue: async node => {
            const branch = await resolveConditionalValueNodeCondition(node, ixAccountNode, ctx);
            if (branch === undefined) {
                // No matching branch: optional accounts resolve using the optional account strategy.
                if (ixAccountNode.isOptional) return null;
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                    accountName: ixAccountNode.identifier,
                    instructionName: getInstruction(ctx).identifier,
                });
            }
            return await visitOrElse(branch, visitor, unexpectedAccountDefaultValueNode);
        },

        visitDataValue: node =>
            Promise.resolve(toAddressOrThrow(getRequiredDataValue(ctx, node.path), ixAccountNode.identifier)),

        visitIdentityValue: requireProvidedAccount,

        visitInjectedValue: async node => {
            const resolved = ctx.scope.resolveOrThrow(node, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
            return await visitOrElse(resolved, visitor, unexpectedAccountDefaultValueNode);
        },

        visitPayerValue: requireProvidedAccount,

        visitPdaValue: async node => (await resolvePdaAddress(node, ctx, ixAccountNode.identifier))[0],

        visitProgramIdValue: () => Promise.resolve(getProgramAddress(ctx.instructionPath)),

        visitProgramLink: node => {
            const program = ctx.linkables.getOrThrow([...ctx.instructionPath, ixAccountNode, node]);
            return Promise.resolve(toAddress(program.publicKey));
        },

        visitPublicKeyValue: node => Promise.resolve(toAddress(node.publicKey)),
    };
    return visitor;
}
