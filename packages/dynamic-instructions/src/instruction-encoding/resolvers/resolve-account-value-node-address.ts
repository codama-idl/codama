import type { Address } from '@solana/addresses';
import type { AccountValueNode } from 'codama';

import { toAddress } from '../../shared/address';
import { AccountError } from '../../shared/errors';
import { resolveAccountAddress } from './resolve-account-address';
import type { BaseResolutionContext, ResolutionPath } from './types';

/**
 * Resolves an AccountValueNode reference to an Address.
 *
 * Shared logic for resolving account references across visitors:
 * Checks if the user provided the account address in accountsInput.
 * Finds the referenced InstructionAccountNode.
 * Delegates to resolveAccountAddress for default value resolution.
 */
export async function resolveAccountValueNodeAddress(
    node: AccountValueNode,
    ctx: BaseResolutionContext,
): Promise<Address | null> {
    const { accountsInput, ixNode, resolutionPath } = ctx;

    // Check if user provided the account address.
    const providedAddress = accountsInput?.[node.name];
    if (providedAddress !== undefined && providedAddress !== null) {
        return toAddress(providedAddress);
    }

    // Find the referenced account in the instruction.
    const referencedIxAccountNode = ixNode.accounts.find(acc => acc.name === node.name);
    if (!referencedIxAccountNode) {
        throw new AccountError(`Referenced account "${node.name}" not found in instruction "${ixNode.name}"`);
    }

    // Detect circular dependencies before recursing.
    detectCircularDependency(node.name, resolutionPath);

    return await resolveAccountAddress({
        accountAddressInput: providedAddress,
        accountsInput: ctx.accountsInput,
        argumentsInput: ctx.argumentsInput,
        ixAccountNode: referencedIxAccountNode,
        ixNode,
        resolutionPath: [...resolutionPath, node.name],
        resolversInput: ctx.resolversInput,
        root: ctx.root,
    });
}

export function detectCircularDependency(nodeName: string, resolutionPath: ResolutionPath) {
    if (resolutionPath.includes(nodeName)) {
        throw new AccountError(`Circular dependency detected: ${[...resolutionPath, nodeName].join(' -> ')}`);
    }
}
