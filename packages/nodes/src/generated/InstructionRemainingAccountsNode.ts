import type { InstructionRemainingAccountsNode, InstructionRemainingAccountsValue } from '@codama/node-types';
import { DocsInput, parseDocs } from '../shared';

/** A "remaining accounts" slot in an instruction — a variable-length tail of accounts derived from a value. */
export function instructionRemainingAccountsNode<const TValue extends InstructionRemainingAccountsValue>(
    value: TValue,
    options: {
        isOptional?: boolean;
        isSigner?: boolean | 'either';
        isWritable?: boolean;
        docs?: DocsInput;
    } = {},
): InstructionRemainingAccountsNode<TValue> {
    const parsedDocs = parseDocs(options.docs);
    return Object.freeze({
        kind: 'instructionRemainingAccountsNode',

        // Data.
        ...(options.isOptional !== undefined && { isOptional: options.isOptional }),
        ...(options.isSigner !== undefined && { isSigner: options.isSigner }),
        ...(options.isWritable !== undefined && { isWritable: options.isWritable }),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        value,
    });
}
