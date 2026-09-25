import { CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES, isCodamaError } from '@codama/errors';
import {
    accountValueNode,
    conditionalValueNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    instructionAccountNode,
    InstructionNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { fillDefaultPdaSeedValuesVisitor } from '../src';

const pda = pdaNode({
    identifier: 'myPda',
    seeds: [
        variablePdaSeedNode('seed1', integerTypeNode('u64')),
        variablePdaSeedNode('seed2', integerTypeNode('u64')),
        variablePdaSeedNode('seed3', publicKeyTypeNode()),
    ],
});
const seed3Account = instructionAccountNode({ identifier: 'seed3', isSigner: false, isWritable: false });
const seed2Data = structTypeNode([structFieldTypeNode({ identifier: 'seed2', type: integerTypeNode('u64') })]);

const setup = (instruction: InstructionNode, extra: Partial<Parameters<typeof programNode>[0]> = {}) => {
    const program = programNode({
        identifier: 'myProgram',
        instructions: [instruction],
        pdas: [pda],
        publicKey: '1111',
        ...extra,
    });
    const linkables = new LinkableDictionary();
    visit(program, getRecordLinkablesVisitor(linkables));
    return { linkables, path: [program, instruction] as const };
};

test('it fills missing pda seed values with default values', () => {
    // Given an instruction that defines both missing seeds, as an account and a data field.
    const instruction = instructionNode({ accounts: [seed3Account], data: seed2Data, identifier: 'myInstruction' });
    const { linkables, path } = setup(instruction);

    // And a pdaValueNode with a single seed filled.
    const node = pdaValueNode('myPda', { seeds: [pdaSeedValueNode('seed1', integerValueNode('42'))] });

    // When we fill the PDA seeds with default values.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(path, linkables));

    // Then we expect the missing seeds to be filled.
    expect(result).toStrictEqual(
        pdaValueNode('myPda', {
            seeds: [
                pdaSeedValueNode('seed1', integerValueNode('42')),
                pdaSeedValueNode('seed2', dataValueNode('seed2')),
                pdaSeedValueNode('seed3', accountValueNode('seed3')),
            ],
        }),
    );
});

test('it fills nested pda value nodes', () => {
    // Given an instruction that defines both missing seeds.
    const instruction = instructionNode({ accounts: [seed3Account], data: seed2Data, identifier: 'myInstruction' });
    const { linkables, path } = setup(instruction);

    // And a pdaValueNode nested inside a conditionalValueNode.
    const node = conditionalValueNode({
        condition: accountValueNode('myAccount'),
        ifTrue: pdaValueNode('myPda', { seeds: [pdaSeedValueNode('seed1', integerValueNode('42'))] }),
    });

    // When we fill the PDA seeds with default values.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(path, linkables));

    // Then we expect the nested pdaValueNode to be filled.
    expect(result).toStrictEqual(
        conditionalValueNode({
            condition: accountValueNode('myAccount'),
            ifTrue: pdaValueNode('myPda', {
                seeds: [
                    pdaSeedValueNode('seed1', integerValueNode('42')),
                    pdaSeedValueNode('seed2', dataValueNode('seed2')),
                    pdaSeedValueNode('seed3', accountValueNode('seed3')),
                ],
            }),
        }),
    );
});

test('it ignores default seeds missing from the instruction', () => {
    // Given an instruction that only defines seed2 as a data field.
    const instruction = instructionNode({ data: seed2Data, identifier: 'myInstruction' });
    const { linkables, path } = setup(instruction);

    // When we fill the PDA seeds with default values.
    const node = pdaValueNode('myPda', { seeds: [pdaSeedValueNode('seed1', integerValueNode('42'))] });
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(path, linkables));

    // Then only seed2 is filled.
    expect(result).toStrictEqual(
        pdaValueNode('myPda', {
            seeds: [
                pdaSeedValueNode('seed1', integerValueNode('42')),
                pdaSeedValueNode('seed2', dataValueNode('seed2')),
            ],
        }),
    );
});

test('it follows linked instruction data and keeps the program ID', () => {
    // Given an instruction whose data links to a defined type containing seed2.
    const instruction = instructionNode({
        accounts: [seed3Account],
        data: definedTypeLinkNode('myArgs'),
        identifier: 'myInstruction',
    });
    const { linkables, path } = setup(instruction, {
        definedTypes: [definedTypeNode({ identifier: 'myArgs', type: seed2Data })],
    });

    // And a pdaValueNode with an explicit program ID.
    const node = pdaValueNode('myPda', {
        programId: accountValueNode('seed3'),
        seeds: [pdaSeedValueNode('seed1', integerValueNode('42'))],
    });

    // When we fill the PDA seeds with default values in strict mode.
    const result = visit(node, fillDefaultPdaSeedValuesVisitor(path, linkables, true));

    // Then the linked data field is used and the program ID is kept.
    expect(result).toStrictEqual(
        pdaValueNode('myPda', {
            programId: accountValueNode('seed3'),
            seeds: [
                pdaSeedValueNode('seed1', integerValueNode('42')),
                pdaSeedValueNode('seed2', dataValueNode('seed2')),
                pdaSeedValueNode('seed3', accountValueNode('seed3')),
            ],
        }),
    );
});

test('it throws in strict mode when a seed references a missing data field', () => {
    // Given an instruction without data and a PDA value referencing a data field.
    const instruction = instructionNode({ accounts: [seed3Account], identifier: 'myInstruction' });
    const { linkables, path } = setup(instruction);
    const node = pdaValueNode('myPda', {
        seeds: [pdaSeedValueNode('seed1', integerValueNode('42')), pdaSeedValueNode('seed2', dataValueNode('missing'))],
    });

    // When we fill the PDA seeds in strict mode, then we expect an error.
    let error: unknown;
    try {
        visit(node, fillDefaultPdaSeedValuesVisitor(path, linkables, true));
    } catch (e) {
        error = e;
    }
    expect(isCodamaError(error, CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES)).toBe(true);
});
