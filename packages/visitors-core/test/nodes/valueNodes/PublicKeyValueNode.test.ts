import { publicKeyValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = publicKeyValueNode('HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[publicKeyValueNode]', null);
test(getDebugStringVisitorMacro, node, `publicKeyValueNode [HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB]`);
test(
    'getDebugStringVisitor: with identifier',
    getDebugStringVisitorMacro,
    publicKeyValueNode('HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB', 'myIdentifier'),
    `publicKeyValueNode [myIdentifier.HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB]`,
);
