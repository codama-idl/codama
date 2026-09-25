import { programNode, rootNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { rootNodeFromAnchorV01 } from '../../src';

test('it creates root nodes', () => {
    const node = rootNodeFromAnchorV01({
        address: '1111',
        instructions: [],
        metadata: {
            name: 'myProgram',
            spec: '0.1.0',
            version: '1.2.3',
        },
    });

    expect(node).toEqual(
        rootNode(
            programNode({
                identifier: 'myProgram',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});

test('it creates root nodes with additional programs', () => {
    const node = rootNodeFromAnchorV01(
        {
            address: '1111',
            instructions: [],
            metadata: { name: 'my_program', spec: '0.1.0', version: '1.2.3' },
        },
        [
            {
                address: '2222',
                instructions: [],
                metadata: { name: 'my_other_program', spec: '0.1.0', version: '4.5.6' },
            },
        ],
    );

    expect(node).toEqual(
        rootNode(programNode({ identifier: 'my_program', publicKey: '1111', version: '1.2.3' }), {
            additionalPrograms: [programNode({ identifier: 'my_other_program', publicKey: '2222', version: '4.5.6' })],
        }),
    );
});
