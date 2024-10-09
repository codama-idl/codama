import { errorNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { errorNodeFromAnchorV00 } from '../../src';

test('it creates error nodes', () => {
    const node = errorNodeFromAnchorV00({
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
