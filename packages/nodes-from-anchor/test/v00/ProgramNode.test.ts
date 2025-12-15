import {
    accountNode,
    bytesTypeNode,
    bytesValueNode,
    constantPdaSeedNodeFromProgramId,
    definedTypeNode,
    errorNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    instructionNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getAnchorInstructionDiscriminatorV00, programNodeFromAnchorV00 } from '../../src';

test('it creates program nodes', () => {
    const node = programNodeFromAnchorV00({
        accounts: [{ name: 'myAccount', seeds: [{ kind: 'programId' }], type: { fields: [], kind: 'struct' } }],
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        instructions: [{ accounts: [], args: [], name: 'myInstruction' }],
        metadata: { address: '1111' },
        name: 'myProgram',
        types: [{ name: 'myType', type: { fields: [], kind: 'struct' } }],
        version: '1.2.3',
    });

    expect(node).toEqual(
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: bytesValueNode('base16', 'f61c0657fb2d322a'),
                            defaultValueStrategy: 'omitted',
                            name: 'discriminator',
                            type: fixedSizeTypeNode(bytesTypeNode(), 8),
                        }),
                    ]),
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    name: 'myAccount',
                    pda: pdaLinkNode('myAccount'),
                }),
            ],
            definedTypes: [definedTypeNode({ name: 'myType', type: structTypeNode([]) })],
            errors: [
                errorNode({
                    code: 42,
                    docs: ['myError: my error message'],
                    message: 'my error message',
                    name: 'myError',
                }),
            ],
            instructions: [
                instructionNode({
                    arguments: [
                        instructionArgumentNode({
                            defaultValue: getAnchorInstructionDiscriminatorV00('myInstruction'),
                            defaultValueStrategy: 'omitted',
                            name: 'discriminator',
                            type: fixedSizeTypeNode(bytesTypeNode(), 8),
                        }),
                    ],
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    name: 'myInstruction',
                }),
            ],
            name: 'myProgram',
            pdas: [pdaNode({ name: 'myAccount', seeds: [constantPdaSeedNodeFromProgramId()] })],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
