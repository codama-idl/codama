import { accountBumpValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = accountBumpValueNode('metadata');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[accountBumpValueNode]', null);
test(getDebugStringVisitorMacro, node, `accountBumpValueNode [metadata]`);
