import { errorNode } from '@kinobi-so/nodes';
import test from 'ava';

import { errorNodeFromAnchorV00 } from '../../src/index.js';

test('it creates error nodes', t => {
    const node = errorNodeFromAnchorV00({
        code: 42,
        msg: 'my error message',
        name: 'myError',
    });

    t.deepEqual(
        node,
        errorNode({
            code: 42,
            docs: ['myError: my error message'],
            message: 'my error message',
            name: 'myError',
        }),
    );
});
