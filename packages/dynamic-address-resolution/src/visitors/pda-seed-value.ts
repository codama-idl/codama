import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, CodamaError } from '@codama/errors';
import { isNode, type PdaSeedValueValue } from 'codama';

import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import { resolveValue } from '../resolvers/resolve-value';
import type { ResolutionContext } from '../resolvers/types';

/**
 * Resolve the value of a variable PDA seed, before it is encoded using the
 * type of the seed. Returns `undefined` when the value is missing. Values
 * other than accounts are resolved as `resolveValue` does, e.g. reading
 * account data for a value injected from an `accountDataValueNode`.
 */
export async function resolvePdaSeedValue(node: PdaSeedValueValue, ctx: ResolutionContext): Promise<unknown> {
    if (isNode(node, 'accountValueNode')) {
        const address = await resolveAccountValueNodeAddress(node, ctx);
        if (address === null) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_DERIVE_PDA, { accountName: node.identifier });
        }
        return address;
    }
    return await resolveValue(node, ctx);
}
