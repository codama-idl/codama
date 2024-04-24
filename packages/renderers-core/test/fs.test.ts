import { KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, KinobiError } from '@kinobi-so/errors';
import test from 'ava';

import { createDirectory, createFile, deleteDirectory, readJson } from '../src/index.js';

if (__NODEJS__) {
    test('it reads JSON objects from files', t => {
        const result = readJson('./test/fs.test.json');
        t.deepEqual(result, { key: 'value' });
    });
} else {
    test('it fails to call readJson', t => {
        t.deepEqual(
            t.throws(() => readJson('./path')),
            new KinobiError(KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'readFileSync' }),
        );
    });
    test('it fails to call createDirectory', t => {
        t.deepEqual(
            t.throws(() => createDirectory('./path')),
            new KinobiError(KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'mkdirSync' }),
        );
    });
    test('it fails to call deleteDirectory', t => {
        t.deepEqual(
            t.throws(() => deleteDirectory('./path')),
            new KinobiError(KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'rmSync' }),
        );
    });
    test('it fails to call createFile', t => {
        t.deepEqual(
            t.throws(() => createFile('./path', 'content')),
            new KinobiError(KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' }),
        );
    });
}
