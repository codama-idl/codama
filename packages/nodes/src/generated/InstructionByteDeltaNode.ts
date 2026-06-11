import type { InstructionByteDeltaNode, InstructionByteDeltaValue } from '@codama/node-types';
import { isNode } from '../Node';

/** A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts. */
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
