import {
    accountLinkNode,
    AccountNode,
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    isNode,
    pdaLinkNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import {
    interceptFirstVisitVisitor,
    interceptVisitor,
    LinkableDictionary,
    recordLinkablesVisitor,
    visit,
    voidVisitor,
} from '../src';

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
    expect(linkables.get(pdaLinkNode('pdaA', 'programA'))).toEqual(node.program.pdas[0]);
    expect(linkables.get(pdaLinkNode('pdaB', 'programB'))).toEqual(node.additionalPrograms[0].pdas[0]);
    expect(linkables.get(accountLinkNode('accountA', 'programA'))).toEqual(node.program.accounts[0]);
    expect(linkables.get(accountLinkNode('accountB', 'programB'))).toEqual(node.additionalPrograms[0].accounts[0]);
    expect(linkables.get(definedTypeLinkNode('typeA', 'programA'))).toEqual(node.program.definedTypes[0]);
    expect(linkables.get(definedTypeLinkNode('typeB', 'programB'))).toEqual(node.additionalPrograms[0].definedTypes[0]);
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

test('it keeps track of the current program when extending a visitor', () => {
    // Given the following root node containing two program containing an account with the same name.
    const programA = programNode({
        accounts: [accountNode({ name: 'someAccount' })],
        name: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        accounts: [accountNode({ name: 'someAccount' })],
        name: 'programB',
        publicKey: '2222',
    });
    const node = rootNode(programA, [programB]);

    // And a recordLinkablesVisitor extending a base visitor that checks
    // the result of getting the linkable node with the same name for each program.
    const linkables = new LinkableDictionary();
    const dictionary: Record<string, AccountNode> = {};
    const baseVisitor = interceptVisitor(voidVisitor(), (node, next) => {
        if (isNode(node, 'programNode')) {
            dictionary[node.name] = linkables.getOrThrow(accountLinkNode('someAccount'));
        }
        next(node);
    });
    const visitor = recordLinkablesVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect each program to have its own account.
    expect(dictionary.programA).toBe(programA.accounts[0]);
    expect(dictionary.programB).toBe(programB.accounts[0]);
});

test('it does not record linkable types that are not under a program node', () => {
    // Given the following account node that is not under a program node.
    const node = accountNode({ name: 'someAccount' });

    // And a recordLinkablesVisitor extending a void visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the node.
    visit(node, visitor);

    // Then we expect the account node to not be recorded.
    expect(linkables.has(accountLinkNode('someAccount'))).toBe(false);
});
