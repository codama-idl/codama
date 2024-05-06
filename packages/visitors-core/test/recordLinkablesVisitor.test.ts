import {
    accountLinkNode,
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    pdaLinkNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { LinkableDictionary, recordLinkablesVisitor, visit, voidVisitor } from '../src';

test('it record all linkable nodes it finds when traversing the tree', () => {
    // Given the following root node containing multiple linkable nodes.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ name: 'accountA' })],
            definedTypes: [definedTypeNode({ name: 'typeA', type: structTypeNode([]) })],
            name: 'programA',
            pdas: [pdaNode({ name: 'pdaA', seeds: [] })],
            publicKey: '1111',
        }),
        [
            programNode({
                accounts: [accountNode({ name: 'accountB' })],
                definedTypes: [definedTypeNode({ name: 'typeB', type: structTypeNode([]) })],
                name: 'programB',
                pdas: [pdaNode({ name: 'pdaB', seeds: [] })],
                publicKey: '2222',
            }),
        ],
    );

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect all linkable nodes to be recorded.
    expect(linkables.get(programLinkNode('programA'))).toEqual(node.program);
    expect(linkables.get(programLinkNode('programB'))).toEqual(node.additionalPrograms[0]);
    expect(linkables.get(pdaLinkNode('pdaA'))).toEqual(node.program.pdas[0]);
    expect(linkables.get(pdaLinkNode('pdaB'))).toEqual(node.additionalPrograms[0].pdas[0]);
    expect(linkables.get(accountLinkNode('accountA'))).toEqual(node.program.accounts[0]);
    expect(linkables.get(accountLinkNode('accountB'))).toEqual(node.additionalPrograms[0].accounts[0]);
    expect(linkables.get(definedTypeLinkNode('typeA'))).toEqual(node.program.definedTypes[0]);
    expect(linkables.get(definedTypeLinkNode('typeB'))).toEqual(node.additionalPrograms[0].definedTypes[0]);
});
