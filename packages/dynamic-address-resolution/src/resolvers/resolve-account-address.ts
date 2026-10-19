import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import type { InstructionAccountNode } from 'codama';
import { visitOrElse } from 'codama';

import { safeStringify } from '../shared/util';
import { createAccountDefaultValueVisitor, unexpectedAccountDefaultValueNode } from '../visitors/account-default-value';
import { getAccountInput, getInstruction, getProgramAddress } from './context';
import type { ResolutionContext } from './types';

/**
 * Resolve the address of an instruction account that is not provided,
 * using its `defaultValue` or the `optionalAccountStrategy` of its instruction.
 * Only optional accounts may resolve to `null`, i.e. be omitted: required
 * accounts whose default value resolves to nothing throw `ACCOUNT_MISSING`.
 */
export async function resolveAccountAddress(
    ixAccountNode: InstructionAccountNode,
    ctx: ResolutionContext,
): Promise<Address | null> {
    // Optional accounts explicitly provided as null resolve using the optional account strategy.
    if (getAccountInput(ctx, ixAccountNode.identifier) === null && ixAccountNode.isOptional) {
        return resolveOptionalAccountWithStrategy(ixAccountNode, ctx);
    }

    if (ixAccountNode.defaultValue) {
        const visitor = createAccountDefaultValueVisitor(ixAccountNode, ctx);
        const address = await visitOrElse(ixAccountNode.defaultValue, visitor, unexpectedAccountDefaultValueNode);
        if (address !== null) return address;

        // Default values resolve to nothing through a conditional without a matching branch, or an
        // optional account that is omitted: optional accounts then use the optional account strategy.
        if (ixAccountNode.isOptional) {
            return resolveOptionalAccountWithStrategy(ixAccountNode, ctx);
        }
    }

    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
        path: [...ctx.instructionPath, ixAccountNode],
    });
}

/**
 * With the "programId" strategy, optional accounts resolve to the program address.
 * With the "omitted" strategy, they are excluded from the account list.
 */
function resolveOptionalAccountWithStrategy(ixAccountNode: InstructionAccountNode, ctx: ResolutionContext) {
    const instruction = getInstruction(ctx);
    switch (instruction.optionalAccountStrategy ?? 'programId') {
        case 'omitted':
            return null;
        case 'programId':
            return getProgramAddress(ctx.instructionPath);
        default:
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY, {
                path: [...ctx.instructionPath, ixAccountNode],
                strategy: safeStringify(instruction.optionalAccountStrategy),
            });
    }
}
