import { errorNode } from '@codama/nodes';
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
            docs: 'myError: my error message',
            identifier: 'myError',
            message: 'my error message',
        }),
    );
});

test('it uses the error name as docs when the message is empty', () => {
    const node = errorNodeFromAnchorV01({
        code: 42,
        name: 'MyError',
    });

    expect(node).toEqual(
        errorNode({
            code: 42,
            docs: 'MyError',
            identifier: 'MyError',
            message: '',
        }),
    );
});
