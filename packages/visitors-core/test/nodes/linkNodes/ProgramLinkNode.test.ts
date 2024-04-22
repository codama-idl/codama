import { programLinkNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = programLinkNode('mplCandyGuard', 'mplCandyMachine');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[programLinkNode]', null);
test(getDebugStringVisitorMacro, node, `programLinkNode [mplCandyGuard.from:mplCandyMachine]`);
