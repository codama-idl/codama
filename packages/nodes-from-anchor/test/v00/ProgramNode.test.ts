import {
    accountNode,
    constantPdaSeedNodeFromProgramId,
    definedTypeNode,
    errorNode,
    instructionNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { programNodeFromAnchorV00 } from '../../src/index.js';

test('it creates program nodes', t => {
    const node = programNodeFromAnchorV00({
        accounts: [{ name: 'myAccount', seeds: [{ kind: 'programId' }], type: { fields: [], kind: 'struct' } }],
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        instructions: [{ accounts: [], args: [], name: 'myInstruction' }],
        metadata: { address: '1111', origin: 'shank' },
        name: 'myProgram',
        types: [{ name: 'myType', type: { fields: [], kind: 'struct' } }],
        version: '1.2.3',
    });

    t.deepEqual(
        node,
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
            instructions: [instructionNode({ name: 'myInstruction' })],
            name: 'myProgram',
            origin: 'shank',
            pdas: [pdaNode({ name: 'myAccount', seeds: [constantPdaSeedNodeFromProgramId()] })],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
