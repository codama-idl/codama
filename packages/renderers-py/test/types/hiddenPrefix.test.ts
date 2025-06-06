import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    definedTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders hidden prefix codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: structTypeNode([
            structFieldTypeNode({
                name: 'myType',
                type: hiddenPrefixTypeNode(numberTypeNode('u32'), [
                    constantValueNodeFromString('utf8', 'hello world'),
                    constantValueNodeFromBytes('base16', 'ff'),
                ]),
            }),
        ]),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('types/myType.py'));
    await renderMapContains(renderMap, 'types/myType.py', [
        `"myType" /HiddenPrefixAdapter(b"\\x68\\x65\\x6c\\x6c\\x6f\\x20\\x77\\x6f\\x72\\x6c\\x64\\xff",borsh.U32)`,
    ]);
});
