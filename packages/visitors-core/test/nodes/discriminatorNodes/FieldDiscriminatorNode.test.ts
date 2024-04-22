import { fieldDiscriminatorNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = fieldDiscriminatorNode('discriminator', 42);

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[fieldDiscriminatorNode]', null);
test(getDebugStringVisitorMacro, node, `fieldDiscriminatorNode [discriminator.offset:42]`);
