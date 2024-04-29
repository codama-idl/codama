import {
    accountNode,
    bytesTypeNode,
    fieldDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { accountNodeFromAnchorV01, getAnchorDiscriminatorV01 } from '../../src/index.js';

test('it creates account nodes with anchor discriminators', t => {
    const node = accountNodeFromAnchorV01({
        discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
        name: 'MyAccount',
    });

    t.deepEqual(
        node,
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: bytesTypeNode(),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myAccount',
        }),
    );
});
