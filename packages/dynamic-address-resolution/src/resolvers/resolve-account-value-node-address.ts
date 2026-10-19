import {
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { AccountValueNode } from 'codama';

import { toAddress } from '../shared/address';
import { getAccountInput, getInstruction } from './context';
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
    const providedAddress = getAccountInput(ctx, node.identifier);
    if (providedAddress !== undefined && providedAddress !== null) {
        return toAddress(providedAddress);
    }

    const instruction = getInstruction(ctx);
    const account = (instruction.accounts ?? []).find(account => account.identifier === node.identifier);
    if (!account) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
            path: ctx.instructionPath,
            referencedName: node.identifier,
        });
    }

    const entry = { key: node.identifier, path: [...ctx.instructionPath, account] };
    detectCircularDependency(entry, ctx);
    return await resolveAccountAddress(account, { ...ctx, resolutionPath: [...ctx.resolutionPath, entry] });
}

/** Throw `CIRCULAR_ACCOUNT_DEPENDENCY` when the given entry is already being resolved. */
export function detectCircularDependency(
    entry: ResolutionPath[number],
    ctx: Pick<ResolutionContext, 'instructionPath' | 'resolutionPath'>,
) {
    if (ctx.resolutionPath.some(({ key }) => key === entry.key)) {
        const cycle = [...ctx.resolutionPath, entry];
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, {
            cycle: cycle.map(({ path }) => path),
            formattedCycle: cycle.map(({ key }) => key).join(' -> '),
            path: ctx.instructionPath,
        });
    }
}
