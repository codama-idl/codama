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
import test from 'ava';

import { LinkableDictionary, recordLinkablesVisitor, visit, voidVisitor } from '../src/index.js';

test('it record all linkable nodes it finds when traversing the tree', t => {
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
    t.deepEqual(linkables.get(programLinkNode('programA')), node.program);
    t.deepEqual(linkables.get(programLinkNode('programB')), node.additionalPrograms[0]);
    t.deepEqual(linkables.get(pdaLinkNode('pdaA')), node.program.pdas[0]);
    t.deepEqual(linkables.get(pdaLinkNode('pdaB')), node.additionalPrograms[0].pdas[0]);
    t.deepEqual(linkables.get(accountLinkNode('accountA')), node.program.accounts[0]);
    t.deepEqual(linkables.get(accountLinkNode('accountB')), node.additionalPrograms[0].accounts[0]);
    t.deepEqual(linkables.get(definedTypeLinkNode('typeA')), node.program.definedTypes[0]);
    t.deepEqual(linkables.get(definedTypeLinkNode('typeB')), node.additionalPrograms[0].definedTypes[0]);
});
