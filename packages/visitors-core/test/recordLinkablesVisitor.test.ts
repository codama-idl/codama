import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountLinkNode,
    AccountNode,
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    identifierString,
    instructionAccountLinkNode,
    InstructionAccountNode,
    instructionAccountNode,
    instructionLinkNode,
    instructionNode,
    integerTypeNode,
    isNode,
    pdaLinkNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import {
    interceptFirstVisitVisitor,
    interceptVisitor,
    LinkableDictionary,
    NodeStack,
    recordLinkablesOnFirstVisitVisitor,
    visit,
    voidVisitor,
} from '../src';

test('it records program nodes', () => {
    // Given the following root node containing multiple program nodes.
    const node = rootNode(programNode({ identifier: 'programA', publicKey: '1111' }), {
        additionalPrograms: [programNode({ identifier: 'programB', publicKey: '2222' })],
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect program paths to be recorded and retrievable.
    expect(linkables.getPath([programLinkNode('programA')])).toEqual([node, node.program]);
    expect(linkables.getPath([programLinkNode('programB')])).toEqual([node, (node.additionalPrograms ?? [])[0]]);
});

test('it records account nodes', () => {
    // Given the following program node containing multiple accounts nodes.
    const node = programNode({
        accounts: [accountNode({ identifier: 'accountA' }), accountNode({ identifier: 'accountB' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect account paths to be recorded and retrievable.
    expect(linkables.getPath([accountLinkNode('accountA', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.accounts ?? [])[0],
    ]);
    expect(linkables.getPath([accountLinkNode('accountB', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.accounts ?? [])[1],
    ]);
});

test('it records defined type nodes', () => {
    // Given the following program node containing multiple defined type nodes.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'typeA', type: integerTypeNode('u32') }),
            definedTypeNode({ identifier: 'typeB', type: integerTypeNode('u32') }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect defined type paths to be recorded and retrievable.
    expect(linkables.getPath([definedTypeLinkNode('typeA', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.definedTypes ?? [])[0],
    ]);
    expect(linkables.getPath([definedTypeLinkNode('typeB', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.definedTypes ?? [])[1],
    ]);
});

test('it records pda nodes', () => {
    // Given the following program node containing multiple pda nodes.
    const node = programNode({
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'pdaA', seeds: [] }), pdaNode({ identifier: 'pdaB', seeds: [] })],
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect pda paths to be recorded and retrievable.
    expect(linkables.getPath([pdaLinkNode('pdaA', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.pdas ?? [])[0],
    ]);
    expect(linkables.getPath([pdaLinkNode('pdaB', { program: programLinkNode('myProgram') })])).toEqual([
        node,
        (node.pdas ?? [])[1],
    ]);
});

test('it records instruction nodes', () => {
    // Given the following program node containing multiple instruction nodes.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [
            instructionNode({ identifier: 'instructionA' }),
            instructionNode({ identifier: 'instructionB' }),
        ],
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect instruction paths to be recorded and retrievable.
    expect(linkables.getPath([instructionLinkNode('instructionA', { program: programLinkNode('myProgram') })])).toEqual(
        [node, (node.instructions ?? [])[0]],
    );
    expect(linkables.getPath([instructionLinkNode('instructionB', { program: programLinkNode('myProgram') })])).toEqual(
        [node, (node.instructions ?? [])[1]],
    );
});

test('it records instruction account nodes', () => {
    // Given the following instruction node containing multiple accounts.
    const instructionAccounts = [
        instructionAccountNode({ identifier: 'accountA', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'accountB', isSigner: false, isWritable: true }),
    ];
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ accounts: instructionAccounts, identifier: 'myInstruction' })],
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect instruction account paths to be recorded and retrievable.
    const instruction = instructionLinkNode('myInstruction', { program: programLinkNode('myProgram') });
    expect(linkables.getPath([instructionAccountLinkNode('accountA', { instruction })])).toEqual([
        node,
        (node.instructions ?? [])[0],
        instructionAccounts[0],
    ]);
    expect(linkables.getPath([instructionAccountLinkNode('accountB', { instruction })])).toEqual([
        node,
        (node.instructions ?? [])[0],
        instructionAccounts[1],
    ]);
});

test('it records all linkable before the first visit of the base visitor', () => {
    // Given the following root node with two programs.
    const node = rootNode(programNode({ identifier: 'programA', publicKey: '1111' }), {
        additionalPrograms: [programNode({ identifier: 'programB', publicKey: '2222' })],
    });

    // And a recordLinkablesOnFirstVisitVisitor extending a base visitor that
    // stores the linkable programs available at every visit.
    const linkables = new LinkableDictionary();
    const events: string[] = [];
    const baseVisitor = interceptFirstVisitVisitor(voidVisitor(), (node, next) => {
        events.push(`programA:${linkables.has([programLinkNode('programA')])}`);
        events.push(`programB:${linkables.has([programLinkNode('programB')])}`);
        next(node);
    });
    const visitor = recordLinkablesOnFirstVisitVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect all linkable nodes to be recorded.
    expect(events).toEqual(['programA:true', 'programB:true']);
});

test('it keeps track of the current program when extending a visitor', () => {
    // Given the following root node containing two program containing an account with the same name.
    const programA = programNode({
        accounts: [accountNode({ identifier: 'someAccount' })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        accounts: [accountNode({ identifier: 'someAccount' })],
        identifier: 'programB',
        publicKey: '2222',
    });
    const node = rootNode(programA, { additionalPrograms: [programB] });

    // And a recordLinkablesOnFirstVisitVisitor extending a base visitor that checks
    // the result of getting the linkable node with the same name for each program.
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const dictionary: Record<string, AccountNode> = {};
    const baseVisitor = interceptVisitor(voidVisitor(), (node, next) => {
        stack.push(node);
        if (isNode(node, 'programNode')) {
            dictionary[node.identifier] = linkables.getOrThrow([...stack.getPath(), accountLinkNode('someAccount')]);
        }
        next(node);
        stack.pop();
    });
    const visitor = recordLinkablesOnFirstVisitVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect each program to have its own account.
    expect(dictionary.programA).toBe((programA.accounts ?? [])[0]);
    expect(dictionary.programB).toBe((programB.accounts ?? [])[0]);
});

test('it keeps track of the current instruction when extending a visitor', () => {
    // Given the following program node containing two instructions each containing an account with the same name.
    const accountA = instructionAccountNode({ identifier: 'someAccount', isSigner: true, isWritable: false });
    const accountB = instructionAccountNode({ identifier: 'someAccount', isSigner: true, isWritable: false });
    const node = programNode({
        identifier: 'myProgram',
        instructions: [
            instructionNode({
                accounts: [accountA],
                identifier: 'instructionA',
            }),
            instructionNode({
                accounts: [accountB],
                identifier: 'instructionB',
            }),
        ],
        publicKey: '1111',
    });

    // And a recordLinkablesOnFirstVisitVisitor extending a base visitor that checks
    // the result of getting the linkable node with the same name for each instruction.
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();
    const dictionary: Record<string, InstructionAccountNode> = {};
    const baseVisitor = interceptVisitor(voidVisitor(), (node, next) => {
        stack.push(node);
        if (isNode(node, 'instructionNode')) {
            dictionary[node.identifier] = linkables.getOrThrow([
                ...stack.getPath(),
                instructionAccountLinkNode('someAccount'),
            ]);
        }
        next(node);
        stack.pop();
    });
    const visitor = recordLinkablesOnFirstVisitVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect each instruction to have its own account.
    expect(dictionary.instructionA).toBe(accountA);
    expect(dictionary.instructionB).toBe(accountB);
});

test('it does not record linkable types that are not under a program node', () => {
    // Given the following account node that is not under a program node.
    const node = accountNode({ identifier: 'someAccount' });

    // And a recordLinkablesOnFirstVisitVisitor extending a void visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);

    // When we visit the node.
    visit(node, visitor);

    // Then we expect the account node to not be recorded.
    expect(linkables.has([accountLinkNode('someAccount')])).toBe(false);
});

test('it can throw an exception when trying to retrieve a missing linked node', () => {
    // Given the following program node with one account.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // And a recorded LinkableDictionary.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesOnFirstVisitVisitor(voidVisitor(), linkables);
    visit(node, visitor);

    // When we try to retrieve a missing account node.
    const linkNode = accountLinkNode('missingAccount', { program: programLinkNode('myProgram') });
    const getMissingAccount = () => linkables.getOrThrow([node, linkNode]);

    // Then we expect an exception to be thrown.
    expect(getMissingAccount).toThrow(
        new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
            kind: 'accountLinkNode',
            linkNode,
            name: identifierString('missingAccount'),
            path: [node, linkNode],
        }),
    );
});
