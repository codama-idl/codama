import { getNodeCodec } from '@codama/dynamic-codecs';
import type { InstructionArgumentNode, TypeNode } from 'codama';
import { instructionArgumentNode, instructionNode, programNode, rootNode } from 'codama';

import { createDefaultValueEncoderVisitor } from '../../../../src/instruction-encoding/visitors/default-value-encoder';

const root = rootNode(programNode({ name: 'test_program', publicKey: '11111111111111111111111111111111' }));

export function makeVisitor(argType: TypeNode) {
    const ixArgNode: InstructionArgumentNode = instructionArgumentNode({
        name: 'testArg',
        type: argType,
    });
    const ixNode = instructionNode({
        arguments: [ixArgNode],
        name: 'testInstruction',
    });
    const codec = getNodeCodec([root, root.program, ixNode, ixArgNode]);
    return createDefaultValueEncoderVisitor(codec);
}
