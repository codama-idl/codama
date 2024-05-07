import { errorNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { errorNodeFromAnchorV01 } from '../../src';

test('it creates error nodes', () => {
    const node = errorNodeFromAnchorV01({
        code: 42,
        msg: 'my error message',
        name: 'myError',
    });

    expect(node).toEqual(
        errorNode({
            code: 42,
            docs: ['myError: my error message'],
            message: 'my error message',
            name: 'myError',
        }),
    );
});
