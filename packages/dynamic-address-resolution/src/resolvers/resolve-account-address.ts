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
import { getInstruction, getProgramAddress } from './context';
import type { ResolutionContext } from './types';

/**
 * Resolve the address of an instruction account that is not provided,
 * using its `defaultValue` or the `optionalAccountStrategy` of its instruction.
 */
export async function resolveAccountAddress(
    ixAccountNode: InstructionAccountNode,
    ctx: ResolutionContext,
): Promise<Address | null> {
    // Optional accounts explicitly provided as null resolve using the optional account strategy.
    if (ctx.accountsInput?.[ixAccountNode.identifier] === null && ixAccountNode.isOptional) {
        return resolveOptionalAccountWithStrategy(ixAccountNode, ctx);
    }

    if (ixAccountNode.defaultValue) {
        const visitor = createAccountDefaultValueVisitor(ixAccountNode, ctx);
        const address = await visitOrElse(ixAccountNode.defaultValue, visitor, unexpectedAccountDefaultValueNode);

        // A conditional default without a matching branch resolves using the optional account strategy.
        if (address === null && ixAccountNode.isOptional) {
            return resolveOptionalAccountWithStrategy(ixAccountNode, ctx);
        }
        return address;
    }

    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
        accountName: ixAccountNode.identifier,
        instructionName: getInstruction(ctx).identifier,
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
                accountName: ixAccountNode.identifier,
                instructionName: instruction.identifier,
                strategy: safeStringify(instruction.optionalAccountStrategy),
            });
    }
}
