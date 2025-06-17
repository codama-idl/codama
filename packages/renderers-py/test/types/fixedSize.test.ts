import { definedTypeNode, fixedSizeTypeNode, stringTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders fixed size codecs', async () => {
    //
    const node = definedTypeNode({
        name: 'myType',
        type: fixedSizeTypeNode(stringTypeNode('utf8'), 10),
    });
    const renderMap = visit(node, getRenderMapVisitor());

    //console.log(renderMap.get('types/myType.py'));
    await renderMapContains(renderMap, 'types/myType.py', [`MyType=FixedSizeString(10,"utf8")`, `pyType = list[int]`]);

    //expect(() => visit(node, getRenderMapVisitor())).toThrowError('DefinedType not supported by fixedSizeTypeNode');
});

test('it renders fixed size codecs with struct', async () => {
    const node = definedTypeNode({
        name: 'myType',
        type: structTypeNode([
            structFieldTypeNode({
                name: 'contentType',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 10),
            }),
        ]),
    });
    const renderMap = visit(node, getRenderMapVisitor());
    //console.log(renderMap.get('types/myType.py'));
    await renderMapContains(renderMap, 'types/myType.py', [`"contentType" /FixedSizeString(10,"utf8"),`]);
});
