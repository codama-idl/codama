import { dataValueNode, isNode, pdaSeedValueNode, programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchor } from '../src';

test('it creates root nodes from IDL version 0.0', () => {
    // When we convert an Anchor IDL version 0.0 into a root node.
    const node = rootNodeFromAnchor({
        instructions: [],
        metadata: { address: '1111' },
        name: 'my_program',
        version: '1.2.3',
    });

    // Then we expect a root node wrapping the converted program.
    expect(node).toEqual(
        rootNode(
            programNode({
                identifier: 'my_program',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});

test('it repoints nested argument seeds to the flattened instruction data', () => {
    // When we convert an Anchor IDL version 0.1 whose PDA seed points to a field of a struct argument.
    const node = rootNodeFromAnchor({
        address: '1111',
        instructions: [
            {
                accounts: [{ name: 'vault', pda: { seeds: [{ kind: 'arg', path: 'params.seed' }] }, writable: true }],
                args: [{ name: 'params', type: { defined: { name: 'Params' } } }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'create',
            },
        ],
        metadata: { name: 'my_program', spec: '0.1.0', version: '1.2.3' },
        types: [{ name: 'Params', type: { fields: [{ name: 'seed', type: 'u64' }], kind: 'struct' } }],
    });

    // Then the PDA seed points to the flattened field.
    const defaultValue = node.program.instructions?.[0].accounts?.[0].defaultValue;
    expect(isNode(defaultValue, 'pdaValueNode') && defaultValue.seeds).toStrictEqual([
        pdaSeedValueNode('params_seed', dataValueNode('seed')),
    ]);
});
