import { publicKeyValueNode, someValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = someValueNode(publicKeyValueNode('73na6yX22Xw3w7q3z39MAwtZyQehEMnUQceszCt94GJ3'));

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[someValueNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
someValueNode
|   publicKeyValueNode [73na6yX22Xw3w7q3z39MAwtZyQehEMnUQceszCt94GJ3]`,
);
