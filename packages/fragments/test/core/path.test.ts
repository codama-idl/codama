import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { joinPath, pathBasename, pathDirectory, relativePath } from '../../src/core/path';

test('it joins path together', () => {
    const result = joinPath('foo', 'bar', 'baz');
    expect(result).toEqual('foo/bar/baz');
});

test('it gets the directory of a path', () => {
    const result = pathDirectory('foo/bar/baz');
    expect(result).toEqual('foo/bar');
});

test('it gets the trailing segment of a path', () => {
    expect(pathBasename('foo/bar/baz')).toEqual('baz');
});

test('it returns the whole path as the basename when there is no slash', () => {
    expect(pathBasename('AccountNode')).toEqual('AccountNode');
});

if (__NODEJS__) {
    test('it computes a relative path between two POSIX paths', () => {
        expect(relativePath('typeNodes', 'shared/numberFormat')).toBe('../shared/numberFormat');
    });
    test('it returns the bare target when the two paths share a directory', () => {
        expect(relativePath('typeNodes', 'typeNodes/StructTypeNode')).toBe('StructTypeNode');
    });
    test('it handles `../`-prefixed targets pointing outside the from directory', () => {
        // `from=typeNodes`, `to=../Docs` → `../../Docs` (up out of `generated/`).
        expect(relativePath('typeNodes', '../Docs')).toBe('../../Docs');
    });
} else {
    test('it throws on non-Node platforms', () => {
        expect(() => relativePath('a', 'b')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'relative' }),
        );
    });
}
