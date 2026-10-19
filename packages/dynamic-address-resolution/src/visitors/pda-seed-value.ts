import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, CodamaError } from '@codama/errors';
import {
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    isNode,
    type NodePath,
    type PdaSeedValueValue,
    type VariablePdaSeedNode,
} from 'codama';

import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import { resolveValue } from '../resolvers/resolve-value';
import type { ResolutionContext } from '../resolvers/types';

/**
 * Resolve the value of a variable PDA seed, before it is encoded using the
 * type of the seed. Returns `undefined` when the value is missing. Injected
 * values are resolved from the scope first, so an account injected into a
 * seed resolves to its address, like an account given directly. Other values
 * are resolved as `resolveValue` does, e.g. reading account data for a value
 * injected from an `accountDataValueNode`. The path of the seed is used by errors.
 */
export async function resolvePdaSeedValue(
    node: PdaSeedValueValue,
    ctx: ResolutionContext,
    seedPath: NodePath<VariablePdaSeedNode>,
): Promise<unknown> {
    const resolved = ctx.scope.resolveOrThrow(node, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
    if (isNode(resolved, 'accountValueNode')) {
        const address = await resolveAccountValueNodeAddress(resolved, ctx);
        if (address === null) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, { path: seedPath });
        }
        return address;
    }
    return await resolveValue(resolved, ctx);
}
