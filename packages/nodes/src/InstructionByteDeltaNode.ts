import type { InstructionByteDeltaNode } from '@kinobi-so/node-types';

import { isNode } from './Node';

export function instructionByteDeltaNode<TValue extends InstructionByteDeltaNode['value']>(
    value: TValue,
    options: {
        subtract?: boolean;
        withHeader?: boolean;
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
