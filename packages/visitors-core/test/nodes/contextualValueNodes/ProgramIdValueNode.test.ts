import { programIdValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = programIdValueNode();

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[programIdValueNode]', null);
test(getDebugStringVisitorMacro, node, `programIdValueNode`);
