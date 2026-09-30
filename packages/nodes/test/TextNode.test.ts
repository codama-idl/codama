import { expect, test } from 'vitest';

import { pluginNode, textNode } from '../src';

test('it returns the right node kind', () => {
    const node = textNode({ content: 'Hello' });
    expect(node.kind).toBe('textNode');
});

test('it returns a frozen object', () => {
    const node = textNode({ content: 'Hello' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the content, including multi-line content', () => {
    const node = textNode({ content: 'line one\nline two' });
    expect(node.content).toBe('line one\nline two');
});

test('it omits plugins when the array is empty', () => {
    const node = textNode({ content: 'Hello', plugins: [] });
    expect('plugins' in node).toBe(false);
});

test('it keeps the provided plugins', () => {
    const plugins = [pluginNode('i18n.fr', 'Bonjour')];
    const node = textNode({ content: 'Hello', plugins });
    expect(node.plugins).toEqual(plugins);
});
