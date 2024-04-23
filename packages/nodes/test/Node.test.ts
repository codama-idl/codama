import test from 'ava';

import {
    assertIsNode,
    assertIsNodeFilter,
    isNode,
    isNodeFilter,
    numberTypeNode,
    publicKeyTypeNode,
    removeNullAndAssertIsNodeFilter,
    tupleTypeNode,
} from '../src/index.js';

test('it checks if a given node is of the given kind', t => {
    t.true(isNode(tupleTypeNode([]), 'tupleTypeNode'));
    t.false(isNode(publicKeyTypeNode(), 'tupleTypeNode'));
    t.false(isNode(null, 'tupleTypeNode'));
});

test('it checks if a given node is part of the given kinds', t => {
    t.true(isNode(tupleTypeNode([]), ['tupleTypeNode', 'publicKeyTypeNode']));
    t.true(isNode(publicKeyTypeNode(), ['tupleTypeNode', 'publicKeyTypeNode']));
    t.false(isNode(numberTypeNode('u8'), ['tupleTypeNode', 'publicKeyTypeNode']));
    t.false(isNode(null, ['tupleTypeNode', 'publicKeyTypeNode']));
});

test('it asserts that a given node is of the given kind', t => {
    t.notThrows(() => assertIsNode(tupleTypeNode([]), 'tupleTypeNode'));
    t.throws(() => assertIsNode(publicKeyTypeNode(), 'tupleTypeNode'), {
        message: 'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
    });
    t.throws(() => assertIsNode(null, 'tupleTypeNode'), {
        message: 'Expected node of kind [tupleTypeNode], got [null].',
    });
});

test('it asserts that a given node is part of the given kinds', t => {
    t.notThrows(() => assertIsNode(tupleTypeNode([]), ['tupleTypeNode', 'publicKeyTypeNode']));
    t.notThrows(() => assertIsNode(publicKeyTypeNode(), ['tupleTypeNode', 'publicKeyTypeNode']));
    t.throws(() => assertIsNode(numberTypeNode('u8'), ['tupleTypeNode', 'publicKeyTypeNode']), {
        message: 'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
    });
    t.throws(() => assertIsNode(null, ['tupleTypeNode', 'publicKeyTypeNode']), {
        message: 'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [null].',
    });
});

test('it returns a callback that checks the node is of the given kind', t => {
    const filter = isNodeFilter('tupleTypeNode');
    t.true(filter(tupleTypeNode([])));
    t.false(filter(publicKeyTypeNode()));
    t.false(filter(null));
});

test('it returns a callback that checks the node is part of the given kinds', t => {
    const filter = isNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
    t.true(filter(tupleTypeNode([])));
    t.true(filter(publicKeyTypeNode()));
    t.false(filter(numberTypeNode('u8')));
    t.false(filter(null));
});

test('it returns a callback that asserts the node is of the given kind', t => {
    const filter = assertIsNodeFilter('tupleTypeNode');
    t.notThrows(() => filter(tupleTypeNode([])));
    t.throws(() => filter(publicKeyTypeNode()), {
        message: 'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
    });
    t.throws(() => filter(null), {
        message: 'Expected node of kind [tupleTypeNode], got [null].',
    });
});

test('it returns a callback that asserts the node is part of the given kinds', t => {
    const filter = assertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
    t.notThrows(() => filter(tupleTypeNode([])));
    t.notThrows(() => filter(publicKeyTypeNode()));
    t.throws(() => filter(numberTypeNode('u8')), {
        message: 'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
    });
    t.throws(() => filter(null), {
        message: 'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [null].',
    });
});

test('it returns a callback that filters out null values and asserts the node is of the given kind', t => {
    const filter = removeNullAndAssertIsNodeFilter('tupleTypeNode');
    t.deepEqual([tupleTypeNode([]), null].filter(filter), [tupleTypeNode([])]);
    t.throws(() => [tupleTypeNode([]), publicKeyTypeNode(), null].filter(filter), {
        message: 'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
    });
});

test('it returns a callback that filters out null values and asserts the node is part of the given kinds', t => {
    const filter = removeNullAndAssertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
    t.deepEqual([tupleTypeNode([]), publicKeyTypeNode(), null].filter(filter), [
        tupleTypeNode([]),
        publicKeyTypeNode(),
    ]);
    t.throws(() => [tupleTypeNode([]), numberTypeNode('u8'), null].filter(filter), {
        message: 'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
    });
});
