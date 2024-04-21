import { enumEmptyVariantTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = enumEmptyVariantTypeNode('initialized');

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[enumEmptyVariantTypeNode]', null);
test(getDebugStringVisitorMacro, node, `enumEmptyVariantTypeNode [initialized]`);
