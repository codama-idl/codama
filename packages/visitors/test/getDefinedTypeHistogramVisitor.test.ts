import {
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    instructionArgumentNode,
    instructionNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getDefinedTypeHistogramVisitor } from '../src';

test('it counts the amount of times defined types are used within the tree', () => {
    // Given the following tree.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        name: 'field1',
                        type: definedTypeLinkNode('myStruct'),
                    }),
                    structFieldTypeNode({
                        name: 'field2',
                        type: definedTypeLinkNode('myEnum'),
                    }),
                ]),
                name: 'myAccount',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                name: 'myStruct',
                type: structTypeNode([]),
            }),
            definedTypeNode({
                name: 'myEnum',
                type: enumTypeNode([]),
            }),
        ],
        errors: [],
        instructions: [
            instructionNode({
                accounts: [],
                arguments: [
                    instructionArgumentNode({
                        name: 'arg1',
                        type: definedTypeLinkNode('myStruct'),
                    }),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'customProgram',
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get its defined type histogram.
    const histogram = visit(node, getDefinedTypeHistogramVisitor());

    // Then we expect the following histogram.
    expect(histogram).toEqual({
        myEnum: {
            directlyAsInstructionArgs: 0,
            inAccounts: 1,
            inDefinedTypes: 0,
            inInstructionArgs: 0,
            total: 1,
        },
        myStruct: {
            directlyAsInstructionArgs: 1,
            inAccounts: 1,
            inDefinedTypes: 0,
            inInstructionArgs: 1,
            total: 2,
        },
    });
});
