import {
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { AccountValueNode } from 'codama';

import { toAddress } from '../shared/address';
import { getInstruction } from './context';
import { resolveAccountAddress } from './resolve-account-address';
import type { ResolutionContext, ResolutionPath } from './types';

/**
 * Resolve an `accountValueNode` to the address of the account it refers to:
 * the provided address if any, otherwise the resolved address of that account.
 */
export async function resolveAccountValueNodeAddress(
    node: AccountValueNode,
    ctx: ResolutionContext,
): Promise<Address | null> {
    const providedAddress = ctx.accountsInput?.[node.identifier];
    if (providedAddress !== undefined && providedAddress !== null) {
        return toAddress(providedAddress);
    }

    const instruction = getInstruction(ctx);
    const account = (instruction.accounts ?? []).find(account => account.identifier === node.identifier);
    if (!account) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
            instructionName: instruction.identifier,
            referencedName: node.identifier,
        });
    }

    detectCircularDependency(node.identifier, ctx.resolutionPath);
    return await resolveAccountAddress(account, { ...ctx, resolutionPath: [...ctx.resolutionPath, node.identifier] });
}

export function detectCircularDependency(nodeName: string, resolutionPath: ResolutionPath) {
    if (resolutionPath.includes(nodeName)) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, {
            chain: [...resolutionPath, nodeName].join(' -> '),
        });
    }
}
