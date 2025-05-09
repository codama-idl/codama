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
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { programNodeFromAnchorV00 } from '../../src';

test('it creates program nodes', () => {
    const node = programNodeFromAnchorV00({
        accounts: [{ name: 'myAccount', seeds: [{ kind: 'programId' }], type: { fields: [], kind: 'struct' } }],
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        instructions: [{ accounts: [], args: [], name: 'myInstruction' }],
        metadata: { address: '1111', origin: 'shank' },
        name: 'myProgram',
        types: [{ name: 'myType', type: { fields: [], kind: 'struct' } }],
        version: '1.2.3',
    });

    expect(node).toEqual(
        programNode({
            accounts: [accountNode({ name: 'myAccount', pda: pdaLinkNode('myAccount') })],
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
                            defaultValue: bytesValueNode('base16', (0).toString(16)),
                            defaultValueStrategy: 'omitted',
                            name: 'discriminator',
                            type: fixedSizeTypeNode(bytesTypeNode(), 1),
                        }),
                    ],
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    name: 'myInstruction',
                }),
            ],
            name: 'myProgram',
            origin: 'shank',
            pdas: [pdaNode({ name: 'myAccount', seeds: [constantPdaSeedNodeFromProgramId()] })],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
