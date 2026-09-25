import {
    accountNode,
    bytesTypeNode,
    bytesValueNode,
    constantPdaSeedNodeFromProgramId,
    definedTypeNode,
    errorNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    instructionNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { programNodeFromAnchorV00 } from '../../src';

test('it creates program nodes', () => {
    // When we convert a Shank program.
    const node = programNodeFromAnchorV00({
        accounts: [{ name: 'my_account', seeds: [{ kind: 'programId' }], type: { fields: [], kind: 'struct' } }],
        errors: [{ code: 42, msg: 'my error message', name: 'MyError' }],
        instructions: [{ accounts: [], args: [], name: 'my_instruction' }],
        metadata: { address: '1111', origin: 'shank' },
        name: 'my_program',
        types: [{ name: 'MyType', type: { fields: [], kind: 'struct' } }],
        version: '1.2.3',
    });

    // Then we expect a program node that keeps the IDL casing and uses Shank discriminators.
    expect(node).toEqual(
        programNode({
            accounts: [accountNode({ identifier: 'my_account', pda: pdaLinkNode('my_account') })],
            definedTypes: [definedTypeNode({ identifier: 'MyType', type: structTypeNode([]) })],
            errors: [
                errorNode({
                    code: 42,
                    docs: 'MyError: my error message',
                    identifier: 'MyError',
                    message: 'my error message',
                }),
            ],
            identifier: 'my_program',
            instructions: [
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: bytesValueNode('base16', '00'),
                            defaultValueStrategy: 'omitted',
                            identifier: 'discriminator',
                            type: bytesTypeNode({ transforms: [fixedSizeTransformNode(1)] }),
                        }),
                    ]),
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    identifier: 'my_instruction',
                }),
            ],
            pdas: [pdaNode({ identifier: 'my_account', seeds: [constantPdaSeedNodeFromProgramId()] })],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});

test('it creates program nodes with docs', () => {
    // When we convert a program with multiple lines of docs.
    const node = programNodeFromAnchorV00({
        docs: ['First line.', 'Second line.'],
        instructions: [],
        metadata: { address: '1111' },
        name: 'my_program',
        version: '1.2.3',
    });

    // Then we expect the docs to be joined into a single string.
    expect(node).toEqual(
        programNode({
            docs: 'First line.\nSecond line.',
            identifier: 'my_program',
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
