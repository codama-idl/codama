import { expect, test } from 'vitest';

import {
    isKinobiError,
    KINOBI_ERROR__UNEXPECTED_NODE_KIND,
    KINOBI_ERROR__UNRECOGNIZED_NODE_KIND,
    KinobiError,
} from '../src';

test('it exposes the Codama error context', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(error.context.kind).toBe('missingNode');
});

test('it exposes the Codama error code', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(error.context.__code).toBe(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND);
});

test('it calls the message formatter with the code and context', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(error.message).toBe('Unrecognized node kind [missingNode].');
});

test('it exposes no cause when none is provided', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(error.cause).toBeUndefined();
});

test('it exposes the cause when provided', () => {
    const cause = {} as unknown;
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { cause, kind: 'missingNode' });
    expect(error.cause).toBe(cause);
});

test('it returns `true` for an instance of `KinobiError`', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(isKinobiError(error)).toBe(true);
});

test('it returns `false` for an instance of `Error`', () => {
    expect(isKinobiError(new Error('bad thing'))).toBe(false);
});

test('it returns `true` when the error code matches', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(isKinobiError(error, KINOBI_ERROR__UNRECOGNIZED_NODE_KIND)).toBe(true);
});

test('it returns `false` when the error code does not match', () => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    expect(isKinobiError(error, KINOBI_ERROR__UNEXPECTED_NODE_KIND)).toBe(false);
});
