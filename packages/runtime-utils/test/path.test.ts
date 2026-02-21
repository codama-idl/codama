import { expect, test } from 'vitest';

import { joinPath, pathDirectory } from '../src';

test('it joins path together', () => {
    const result = joinPath('foo', 'bar', 'baz');
    expect(result).toEqual('foo/bar/baz');
});

test('it gets the directory of a path', () => {
    const result = pathDirectory('foo/bar/baz');
    expect(result).toEqual('foo/bar');
});
