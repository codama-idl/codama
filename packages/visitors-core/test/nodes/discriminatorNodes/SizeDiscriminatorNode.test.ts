import { sizeDiscriminatorNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = sizeDiscriminatorNode(42);

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[sizeDiscriminatorNode]', null);
test(getDebugStringVisitorMacro, node, `sizeDiscriminatorNode [42]`);
