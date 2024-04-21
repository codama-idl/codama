import { argumentValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = argumentValueNode('space');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[argumentValueNode]', null);
test(getDebugStringVisitorMacro, node, `argumentValueNode [space]`);
