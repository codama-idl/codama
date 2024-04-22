import { programNode, rootNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = rootNode(
    programNode({
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    }),
    [
        programNode({
            name: 'splAddressLookupTable',
            publicKey: 'AddressLookupTab1e1111111111111111111111111',
        }),
    ],
);

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[rootNode]', null);
test(deleteNodesVisitorMacro, node, '[programNode]', null);
test(deleteNodesVisitorMacro, node, '[programNode]splAddressLookupTable', {
    ...node,
    additionalPrograms: [],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
rootNode
|   programNode [splToken.TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA]
|   programNode [splAddressLookupTable.AddressLookupTab1e1111111111111111111111111]`,
);
