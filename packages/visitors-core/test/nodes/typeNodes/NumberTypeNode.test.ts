import { numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = numberTypeNode('f64');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(getDebugStringVisitorMacro, node, `numberTypeNode [f64]`);
test(
    'getDebugStringVisitor: bigEndian',
    getDebugStringVisitorMacro,
    numberTypeNode('f64', 'be'),
    `numberTypeNode [f64.bigEndian]`,
);
