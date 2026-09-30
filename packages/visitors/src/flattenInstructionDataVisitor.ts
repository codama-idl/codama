import { assertIsNode, instructionNode, isNode } from '@codama/nodes';
import { bottomUpTransformerVisitor } from '@codama/visitors-core';

import { flattenStruct } from './flattenStructVisitor';

/**
 * Inline the fields of the struct-typed fields of every instruction's
 * `data`, when that data is a struct.
 *
 * Linked data (`definedTypeLinkNode`) is left untouched, since the defined
 * type may be shared; unwrap it first (e.g. with
 * `unwrapInstructionDataDefinedTypesVisitor`) to flatten it.
 */
export function flattenInstructionDataVisitor() {
    return bottomUpTransformerVisitor([
        {
            select: '[instructionNode]',
            transform: instruction => {
                assertIsNode(instruction, 'instructionNode');
                if (!isNode(instruction.data, 'structTypeNode')) return instruction;
                return instructionNode({ ...instruction, data: flattenStruct(instruction.data) });
            },
        },
    ]);
}
