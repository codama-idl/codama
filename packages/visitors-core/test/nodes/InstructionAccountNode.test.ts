import { accountValueNode, instructionAccountNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = instructionAccountNode({
    defaultValue: accountValueNode('authority'),
    isOptional: false,
    isSigner: 'either',
    isWritable: true,
    name: 'owner',
});

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[instructionAccountNode]', null);
test(deleteNodesVisitorMacro, node, '[accountValueNode]', instructionAccountNode({ ...node, defaultValue: undefined }));
test(
    getDebugStringVisitorMacro,
    node,
    `
instructionAccountNode [owner.writable.optionalSigner]
|   accountValueNode [authority]`,
);
