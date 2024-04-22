import { argumentValueNode, instructionRemainingAccountsNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = instructionRemainingAccountsNode(argumentValueNode('remainingAccounts'), {
    isSigner: 'either',
    isWritable: true,
});

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[instructionRemainingAccountsNode]', null);
test(deleteNodesVisitorMacro, node, '[argumentValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
instructionRemainingAccountsNode [writable.optionalSigner]
|   argumentValueNode [remainingAccounts]`,
);
