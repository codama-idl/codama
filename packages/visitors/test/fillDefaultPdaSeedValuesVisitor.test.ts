import {
    accountValueNode,
    argumentValueNode,
    conditionalValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { fillDefaultPdaSeedValuesVisitor } from '../src';

test('it fills missing pda seed values with default values', () => {
    // Given a pdaNode with three variable seeds.
    const program = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'myPda',
                seeds: [
                    variablePdaSeedNode('seed1', numberTypeNode('u64')),
                    variablePdaSeedNode('seed2', numberTypeNode('u64')),
                    variablePdaSeedNode('seed3', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: '1111',
    });
    const pda = program.pdas[0];

    // And a linkable dictionary that recorded this PDA.
    const linkables = new LinkableDictionary();
    linkables.stack.push(program);
    linkables.record(pda);

    // And a pdaValueNode with a single seed filled.
    const node = pdaValueNode('myPda', [pdaSeedValueNode('seed1', numberValueNode(42))]);

    // And an instruction node that defines both of the missing seeds.
    const instruction = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: false,
                isWritable: false,
                name: 'seed3',
            }),
        ],
        arguments: [instructionArgumentNode({ name: 'seed2', type: numberTypeNode('u64') })],
        name: 'myInstruction',
    });

    // When we fill the PDA seeds with default values.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(instruction, linkables));

    // Then we expect the following pdaValueNode to be returned.
    expect(result).toEqual(
        pdaValueNode('myPda', [
            pdaSeedValueNode('seed1', numberValueNode(42)),
            pdaSeedValueNode('seed2', argumentValueNode('seed2')),
            pdaSeedValueNode('seed3', accountValueNode('seed3')),
        ]),
    );
});

test('it fills nested pda value nodes', () => {
    // Given a pdaNode with three variable seeds.
    const program = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'myPda',
                seeds: [
                    variablePdaSeedNode('seed1', numberTypeNode('u64')),
                    variablePdaSeedNode('seed2', numberTypeNode('u64')),
                    variablePdaSeedNode('seed3', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: '1111',
    });
    const pda = program.pdas[0];

    // And a linkable dictionary that recorded this PDA.
    const linkables = new LinkableDictionary();
    linkables.stack.push(program);
    linkables.record(pda);

    // And a pdaValueNode nested inside a conditionalValueNode.
    const node = conditionalValueNode({
        condition: accountValueNode('myAccount'),
        ifTrue: pdaValueNode('myPda', [pdaSeedValueNode('seed1', numberValueNode(42))]),
    });

    // And an instruction node that defines both of the missing seeds.
    const instruction = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: false,
                isWritable: false,
                name: 'seed3',
            }),
        ],
        arguments: [instructionArgumentNode({ name: 'seed2', type: numberTypeNode('u64') })],
        name: 'myInstruction',
    });

    // When we fill the PDA seeds with default values.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(instruction, linkables));

    // Then we expect the following conditionalValueNode to be returned.
    expect(result).toEqual(
        conditionalValueNode({
            condition: accountValueNode('myAccount'),
            ifTrue: pdaValueNode('myPda', [
                pdaSeedValueNode('seed1', numberValueNode(42)),
                pdaSeedValueNode('seed2', argumentValueNode('seed2')),
                pdaSeedValueNode('seed3', accountValueNode('seed3')),
            ]),
        }),
    );
});

test('it ignores default seeds missing from the instruction', () => {
    // Given a pdaNode with three variable seeds.
    const program = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'myPda',
                seeds: [
                    variablePdaSeedNode('seed1', numberTypeNode('u64')),
                    variablePdaSeedNode('seed2', numberTypeNode('u64')),
                    variablePdaSeedNode('seed3', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: '1111',
    });
    const pda = program.pdas[0];

    // And a linkable dictionary that recorded this PDA.
    const linkables = new LinkableDictionary();
    linkables.stack.push(program);
    linkables.record(pda);

    // And a pdaValueNode with a single seed filled.
    const node = pdaValueNode('myPda', [pdaSeedValueNode('seed1', numberValueNode(42))]);

    // And an instruction node that defines only seed2 as an argument.
    const instruction = instructionNode({
        arguments: [instructionArgumentNode({ name: 'seed2', type: numberTypeNode('u64') })],
        name: 'myInstruction',
    });

    // When we fill the PDA seeds with default values.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(instruction, linkables));

    // Then we expect the following pdaValueNode to be returned.
    expect(result).toEqual(
        pdaValueNode('myPda', [
            pdaSeedValueNode('seed1', numberValueNode(42)),
            pdaSeedValueNode('seed2', argumentValueNode('seed2')),
        ]),
    );
});
