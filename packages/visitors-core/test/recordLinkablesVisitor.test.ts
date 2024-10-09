import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountLinkNode,
    AccountNode,
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    instructionAccountLinkNode,
    InstructionAccountNode,
    instructionAccountNode,
    instructionArgumentLinkNode,
    instructionArgumentNode,
    instructionLinkNode,
    instructionNode,
    isNode,
    numberTypeNode,
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
    recordLinkablesVisitor,
    visit,
    voidVisitor,
} from '../src';

test('it records program nodes', () => {
    // Given the following root node containing multiple program nodes.
    const node = rootNode(programNode({ name: 'programA', publicKey: '1111' }), [
        programNode({ name: 'programB', publicKey: '2222' }),
    ]);

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect program nodes to be recorded and retrievable.
    expect(linkables.get(programLinkNode('programA'))).toEqual(node.program);
    expect(linkables.get(programLinkNode('programB'))).toEqual(node.additionalPrograms[0]);
});

test('it records account nodes', () => {
    // Given the following program node containing multiple accounts nodes.
    const node = programNode({
        accounts: [accountNode({ name: 'accountA' }), accountNode({ name: 'accountB' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect account nodes to be recorded and retrievable.
    expect(linkables.get(accountLinkNode('accountA', 'myProgram'))).toEqual(node.accounts[0]);
    expect(linkables.get(accountLinkNode('accountB', 'myProgram'))).toEqual(node.accounts[1]);
});

test('it records defined type nodes', () => {
    // Given the following program node containing multiple defined type nodes.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ name: 'typeA', type: numberTypeNode('u32') }),
            definedTypeNode({ name: 'typeB', type: numberTypeNode('u32') }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect defined type nodes to be recorded and retrievable.
    expect(linkables.get(definedTypeLinkNode('typeA', 'myProgram'))).toEqual(node.definedTypes[0]);
    expect(linkables.get(definedTypeLinkNode('typeB', 'myProgram'))).toEqual(node.definedTypes[1]);
});

test('it records pda nodes', () => {
    // Given the following program node containing multiple pda nodes.
    const node = programNode({
        name: 'myProgram',
        pdas: [pdaNode({ name: 'pdaA', seeds: [] }), pdaNode({ name: 'pdaB', seeds: [] })],
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect pda nodes to be recorded and retrievable.
    expect(linkables.get(pdaLinkNode('pdaA', 'myProgram'))).toEqual(node.pdas[0]);
    expect(linkables.get(pdaLinkNode('pdaB', 'myProgram'))).toEqual(node.pdas[1]);
});

test('it records instruction nodes', () => {
    // Given the following program node containing multiple instruction nodes.
    const node = programNode({
        instructions: [instructionNode({ name: 'instructionA' }), instructionNode({ name: 'instructionB' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect instruction nodes to be recorded and retrievable.
    expect(linkables.get(instructionLinkNode('instructionA', 'myProgram'))).toEqual(node.instructions[0]);
    expect(linkables.get(instructionLinkNode('instructionB', 'myProgram'))).toEqual(node.instructions[1]);
});

test('it records instruction account nodes', () => {
    // Given the following instruction node containing multiple accounts.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'accountA' }),
                    instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect instruction account nodes to be recorded and retrievable.
    const instruction = instructionLinkNode('myInstruction', 'myProgram');
    expect(linkables.get(instructionAccountLinkNode('accountA', instruction))).toEqual(
        node.instructions[0].accounts[0],
    );
    expect(linkables.get(instructionAccountLinkNode('accountB', instruction))).toEqual(
        node.instructions[0].accounts[1],
    );
});

test('it records instruction argument nodes', () => {
    // Given the following instruction node containing multiple arguments.
    const node = programNode({
        instructions: [
            instructionNode({
                arguments: [
                    instructionArgumentNode({ name: 'argumentA', type: numberTypeNode('u32') }),
                    instructionArgumentNode({ name: 'argumentB', type: numberTypeNode('u32') }),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending any visitor.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect instruction argument nodes to be recorded and retrievable.
    const instruction = instructionLinkNode('myInstruction', 'myProgram');
    expect(linkables.get(instructionArgumentLinkNode('argumentA', instruction))).toEqual(
        node.instructions[0].arguments[0],
    );
    expect(linkables.get(instructionArgumentLinkNode('argumentB', instruction))).toEqual(
        node.instructions[0].arguments[1],
    );
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

test('it keeps track of the current instruction when extending a visitor', () => {
    // Given the following program node containing two instructions each containing an account with the same name.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'someAccount' })],
                name: 'instructionA',
            }),
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'someAccount' })],
                name: 'instructionB',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recordLinkablesVisitor extending a base visitor that checks
    // the result of getting the linkable node with the same name for each instruction.
    const linkables = new LinkableDictionary();
    const dictionary: Record<string, InstructionAccountNode> = {};
    const baseVisitor = interceptVisitor(voidVisitor(), (node, next) => {
        if (isNode(node, 'instructionNode')) {
            dictionary[node.name] = linkables.getOrThrow(instructionAccountLinkNode('someAccount'));
        }
        next(node);
    });
    const visitor = recordLinkablesVisitor(baseVisitor, linkables);

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect each instruction to have its own account.
    expect(dictionary.instructionA).toBe(node.instructions[0].accounts[0]);
    expect(dictionary.instructionB).toBe(node.instructions[1].accounts[0]);
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

test('it can throw an exception when trying to retrieve a missing linked node', () => {
    // Given the following program node with one account.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // And a recorded LinkableDictionary.
    const linkables = new LinkableDictionary();
    const visitor = recordLinkablesVisitor(voidVisitor(), linkables);
    visit(node, visitor);

    // When we try to retrieve a missing account node.
    const getMissingAccount = () => linkables.getOrThrow(accountLinkNode('missingAccount', 'myProgram'));

    // Then we expect an exception to be thrown.
    expect(getMissingAccount).toThrow(
        new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
            kind: 'accountLinkNode',
            linkNode: accountLinkNode('missingAccount', 'myProgram'),
            name: 'missingAccount',
            stack: [],
        }),
    );
});
