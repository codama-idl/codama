import { expect, test } from 'vitest';

import { errorNode, textNode } from '../src';

test('it returns the right node kind', () => {
    const node = errorNode({ code: 42, identifier: 'foo', message: 'error message' });
    expect(node.kind).toBe('errorNode');
});

test('it returns a frozen object', () => {
    const node = errorNode({ code: 42, identifier: 'foo', message: 'error message' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the code and message', () => {
    const node = errorNode({ code: 42, identifier: 'foo', message: 'error message' });
    expect(node.code).toBe(42);
    expect(node.message).toBe('error message');
});

test('it accepts a text node as message', () => {
    const message = textNode({ content: 'error message' });
    const node = errorNode({ code: 42, identifier: 'foo', message });
    expect(node.message).toBe(message);
});
