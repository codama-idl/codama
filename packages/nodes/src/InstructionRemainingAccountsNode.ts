import type { ArgumentValueNode, InstructionRemainingAccountsNode, ResolverValueNode } from '@codama/node-types';

import { DocsInput, parseDocs } from './shared';

export function instructionRemainingAccountsNode<TValue extends ArgumentValueNode | ResolverValueNode>(
    value: TValue,
    options: {
        docs?: DocsInput;
        isOptional?: boolean;
        isSigner?: boolean | 'either';
        isWritable?: boolean;
    } = {},
): InstructionRemainingAccountsNode<TValue> {
    return Object.freeze({
        kind: 'instructionRemainingAccountsNode',

        // Data.
        ...(options.isOptional !== undefined && { isOptional: options.isOptional }),
        ...(options.isSigner !== undefined && { isSigner: options.isSigner }),
        ...(options.isWritable !== undefined && { isWritable: options.isWritable }),
        docs: parseDocs(options.docs),

        // Children.
        value,
    });
}
