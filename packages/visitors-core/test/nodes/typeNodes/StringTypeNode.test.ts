import { stringTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = stringTypeNode('utf8');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[stringTypeNode]', null);
test(getDebugStringVisitorMacro, node, `stringTypeNode [utf8]`);

// Different encoding.
test(
    'getDebugStringVisitor: different encoding',
    getDebugStringVisitorMacro,
    stringTypeNode('base58'),
    `stringTypeNode [base58]`,
);
