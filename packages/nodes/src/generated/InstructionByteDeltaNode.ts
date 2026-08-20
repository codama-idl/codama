import type { InstructionByteDeltaNode, InstructionByteDeltaValue } from '@codama/node-types';

import { isNode } from '../Node';

/**
 * A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts.
 * For instance, if an instruction creates a new account of 42 bytes, this node can carry that information, enabling clients to allocate the right amount of lamports to cover the cost of executing the instruction.
 */
export function instructionByteDeltaNode<const TValue extends InstructionByteDeltaValue>(
    value: TValue,
    options: {
        withHeader?: boolean;
        subtract?: boolean;
    } = {},
): InstructionByteDeltaNode<TValue> {
    return Object.freeze({
        kind: 'instructionByteDeltaNode',

        // Data.
        withHeader: options.withHeader ?? !isNode(value, 'resolverValueNode'),
        ...(options.subtract !== undefined && { subtract: options.subtract }),

        // Children.
        value,
    });
}
