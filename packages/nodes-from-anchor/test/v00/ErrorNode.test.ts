import { errorNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { errorNodeFromAnchorV00 } from '../../src';

test('it creates error nodes', () => {
    // When we convert an Anchor error without docs.
    const node = errorNodeFromAnchorV00({
        code: 42,
        msg: 'my error message',
        name: 'MyError',
    });

    // Then we expect an error node whose docs are derived from its name and message.
    expect(node).toEqual(
        errorNode({
            code: 42,
            docs: 'MyError: my error message',
            identifier: 'MyError',
            message: 'my error message',
        }),
    );
});

test('it creates error nodes with docs', () => {
    // When we convert an Anchor error with docs.
    const node = errorNodeFromAnchorV00({
        code: 42,
        docs: ['First line.', 'Second line.'],
        msg: 'my error message',
        name: 'MyError',
    });

    // Then we expect the docs to be joined into a single string.
    expect(node).toEqual(
        errorNode({
            code: 42,
            docs: 'First line.\nSecond line.',
            identifier: 'MyError',
            message: 'my error message',
        }),
    );
});
