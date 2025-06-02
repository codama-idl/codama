import {
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

// Given the following event discriminated union.
const eventTypeNode = definedTypeNode({
    name: 'event',
    type: enumTypeNode([
        enumEmptyVariantTypeNode('quit'),
        enumTupleVariantTypeNode('write', tupleTypeNode([stringTypeNode('utf8')])),
        enumStructVariantTypeNode(
            'move',
            structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
            ]),
        ),
    ]),
});

test('it exports discriminated union types', async () => {
    console.log(eventTypeNode);
    const renderMap = visit(eventTypeNode, getRenderMapVisitor());

    // Then we expect the following types to be exported.
    await renderMapContains(renderMap, 'types/event.py', [
        'EventKind = typing.Union[\n\
    Quit,\n\
        Write,\n\
        Move,\n\
    ]\n\
    EventJSON = typing.Union[\n\
        QuitJSON,\n\
        WriteJSON,\n\
        MoveJSON,\n\
    ]\n\
',
    ]);
});
test('it exports discriminated layout', async () => {
    // When we render a discriminated union.
    const renderMap = visit(eventTypeNode, getRenderMapVisitor());

    // Then we expect the following codec functions to be exported.
    await renderMapContains(renderMap, 'types/event.py', [
        'layout = EnumForCodegen(',
        '"Quit" / borsh.CStruct(),',
        '"Write" / borsh.CStruct("item_0" / borsh.String,),',
        '"Move" / borsh.CStruct("x" /borsh.U32,"y" /borsh.U32),',
    ]);
});
