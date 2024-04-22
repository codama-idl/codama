import test from 'ava';

import {
    isKinobiError,
    KINOBI_ERROR__UNEXPECTED_NODE_KIND,
    KINOBI_ERROR__UNRECOGNIZED_NODE_KIND,
    KinobiError,
} from '../src/index.js';

test('it exposes the Kinobi error context', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.is(error.context.kind, 'missingNode');
});

test('it exposes the Kinobi error code', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.is(error.context.__code, KINOBI_ERROR__UNRECOGNIZED_NODE_KIND);
});

test('it calls the message formatter with the code and context', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.is(error.message, 'Unrecognized node kind [missingNode].');
});

test('it exposes no cause when none is provided', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.is(error.cause, undefined);
});

test('it exposes the cause when provided', t => {
    const cause = {} as unknown;
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { cause, kind: 'missingNode' });
    t.is(error.cause, cause);
});

test('it returns `true` for an instance of `KinobiError`', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.true(isKinobiError(error));
});

test('it returns `false` for an instance of `Error`', t => {
    t.false(isKinobiError(new Error('bad thing')));
});

test('it returns `true` when the error code matches', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.true(isKinobiError(error, KINOBI_ERROR__UNRECOGNIZED_NODE_KIND));
});

test('it returns `false` when the error code does not match', t => {
    const error = new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, { kind: 'missingNode' });
    t.false(isKinobiError(error, KINOBI_ERROR__UNEXPECTED_NODE_KIND));
});
