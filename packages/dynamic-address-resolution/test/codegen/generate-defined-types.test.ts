import {
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    integerTypeNode,
    optionTypeNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { generateDefinedTypes } from '../../src/codegen/generate-defined-types';

// A linked list node, whose next node links back to it.
const node = definedTypeNode({
    identifier: 'node',
    type: structTypeNode([
        structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') }),
        structFieldTypeNode({ identifier: 'next', type: optionTypeNode(definedTypeLinkNode('node')) }),
    ]),
});
const push = instructionNode({
    data: structTypeNode([structFieldTypeNode({ identifier: 'head', type: definedTypeLinkNode('node') })]),
    identifier: 'push',
});

describe('generateDefinedTypes', () => {
    test('it emits nothing without recursive types', () => {
        const amount = definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
        const transfer = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: definedTypeLinkNode('amount') })]),
            identifier: 'transfer',
        });
        const root = rootNode(
            programNode({ definedTypes: [amount], identifier: 'p', instructions: [transfer], publicKey: '1111' }),
        );
        expect(generateDefinedTypes(root)).toBe('');
    });

    test('it emits the aliases of recursive types used by instruction data', () => {
        const root = rootNode(
            programNode({ definedTypes: [node], identifier: 'p', instructions: [push], publicKey: '1111' }),
        );
        expect(generateDefinedTypes(root)).toBe(
            'export type NodeArgs = { value: number | bigint; next?: NodeArgs | null };\n\n',
        );
    });

    test('it emits the aliases of recursive types used by PDA seeds', () => {
        const pda = pdaNode({ identifier: 'list', seeds: [variablePdaSeedNode('head', definedTypeLinkNode('node'))] });
        const root = rootNode(programNode({ definedTypes: [node], identifier: 'p', pdas: [pda], publicKey: '1111' }));
        expect(generateDefinedTypes(root)).toBe(
            'export type NodeArgs = { value: number | bigint; next?: NodeArgs | null };\n\n',
        );
    });

    test('it emits the aliases of mutually recursive types once each', () => {
        // Given a tree whose branches hold trees, used by the data of an instruction.
        const tree = definedTypeNode({
            identifier: 'tree',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'branch', type: optionTypeNode(definedTypeLinkNode('branch')) }),
            ]),
        });
        const branch = definedTypeNode({
            identifier: 'branch',
            type: structTypeNode([structFieldTypeNode({ identifier: 'tree', type: definedTypeLinkNode('tree') })]),
        });
        const plant = instructionNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'tree', type: definedTypeLinkNode('tree') }),
                structFieldTypeNode({ identifier: 'branch', type: definedTypeLinkNode('branch') }),
            ]),
            identifier: 'plant',
        });
        const root = rootNode(
            programNode({ definedTypes: [tree, branch], identifier: 'p', instructions: [plant], publicKey: '1111' }),
        );

        // Then each type referenced by its alias is emitted once.
        expect(generateDefinedTypes(root)).toBe(
            'export type TreeArgs = { branch?: { tree: TreeArgs } | null };\n\n' +
                'export type BranchArgs = { tree: { branch?: BranchArgs | null } };\n\n',
        );
    });

    test('it emits the aliases only referenced by other aliases', () => {
        // Given data linking to `b`, where `a` and `b` link to each other, and `c` links to `a` and itself.
        const link = (identifier: string) =>
            structFieldTypeNode({ identifier, type: optionTypeNode(definedTypeLinkNode(identifier)) });
        const a = definedTypeNode({ identifier: 'a', type: structTypeNode([link('b')]) });
        const b = definedTypeNode({ identifier: 'b', type: structTypeNode([link('a'), link('c')]) });
        const c = definedTypeNode({ identifier: 'c', type: structTypeNode([link('a'), link('c')]) });
        const ix = instructionNode({ data: definedTypeLinkNode('b'), identifier: 'ix' });
        const root = rootNode(
            programNode({ definedTypes: [a, b, c], identifier: 'p', instructions: [ix], publicKey: '1111' }),
        );

        // Then the alias of `a`, only referenced within the alias of `c`, is emitted too.
        expect(generateDefinedTypes(root)).toBe(
            'export type BArgs = { a?: { b?: BArgs | null } | null; c?: { a?: { b?: BArgs | null } | null; c?: CArgs | null } | null };\n\n' +
                'export type CArgs = { a?: { b?: { a?: AArgs | null; c?: CArgs | null } | null } | null; c?: CArgs | null };\n\n' +
                'export type AArgs = { b?: { a?: AArgs | null; c?: { a?: AArgs | null; c?: CArgs | null } | null } | null };\n\n',
        );
    });

    test('it prefixes the aliases of types from other programs with their program name', () => {
        // Given data linking to a recursive type of another program.
        const head = instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    identifier: 'head',
                    type: definedTypeLinkNode('node', { program: programLinkNode('other') }),
                }),
            ]),
            identifier: 'push',
        });
        const root = rootNode(programNode({ identifier: 'p', instructions: [head], publicKey: '1111' }), {
            additionalPrograms: [programNode({ definedTypes: [node], identifier: 'other', publicKey: '2222' })],
        });
        expect(generateDefinedTypes(root)).toBe(
            'export type OtherNodeArgs = { value: number | bigint; next?: OtherNodeArgs | null };\n\n',
        );
    });
});
