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

import { interceptFirstVisitVisitor, LinkableDictionary, recordLinkablesVisitor, visit, voidVisitor } from '../src';

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

test('it records all linkable before the first visit of the base visitor', () => {
    // Given the following root node with two programs.
    const node = rootNode(programNode({ name: 'programA', publicKey: '1111' }), [
        programNode({ name: 'programB', publicKey: '2222' }),
    ]);

    // And a recordLinkablesVisitor extending a base visitor that
    // stores the linkable programs available at every visit.
    const linkables = new LinkableDictionary();
    const events: string[] = [];
    const baseVisitor = interceptFirstVisitVisitor(voidVisitor(), (node, next) => {
        events.push(`programA:${linkables.has(programLinkNode('programA'))}`);
        events.push(`programB:${linkables.has(programLinkNode('programB'))}`);
        next(node);
    });
    const visitor = recordLinkablesVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect all linkable nodes to be recorded.
    expect(events).toEqual(['programA:true', 'programB:true']);
});
