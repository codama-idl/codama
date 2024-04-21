import { errorNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = errorNode({
    code: 42,
    message: 'The provided account does not match the owner of the token account.',
    name: 'InvalidTokenOwner',
});

test(mergeVisitorMacro, node, 1);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[errorNode]', null);
test(getDebugStringVisitorMacro, node, `errorNode [42.invalidTokenOwner]`);
