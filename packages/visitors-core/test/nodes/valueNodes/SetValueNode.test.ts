import { publicKeyValueNode, setValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = setValueNode([
    publicKeyValueNode('8jeCDm1zPb68kfzv5MaUo9BK7beGzFrGHA9hhMGL1ay1'),
    publicKeyValueNode('8PEBfDem8yb5aUkrhKgNKMraB9gR8WtJDprEW3QwLFz'),
    publicKeyValueNode('97hChLjFswwqBrE82Q4wqctpFfB2jZ91svxCv68iCrqG'),
]);

test(mergeVisitorMacro, node, 4);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[setValueNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyValueNode]', {
    ...node,
    items: [],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
setValueNode
|   publicKeyValueNode [8jeCDm1zPb68kfzv5MaUo9BK7beGzFrGHA9hhMGL1ay1]
|   publicKeyValueNode [8PEBfDem8yb5aUkrhKgNKMraB9gR8WtJDprEW3QwLFz]
|   publicKeyValueNode [97hChLjFswwqBrE82Q4wqctpFfB2jZ91svxCv68iCrqG]`,
);
