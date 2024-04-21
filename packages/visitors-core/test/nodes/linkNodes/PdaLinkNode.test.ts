import { pdaLinkNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = pdaLinkNode('associatedToken', 'splToken');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[pdaLinkNode]', null);
test(getDebugStringVisitorMacro, node, `pdaLinkNode [associatedToken.from:splToken]`);
