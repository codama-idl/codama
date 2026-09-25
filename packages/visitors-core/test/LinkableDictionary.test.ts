import {
    accountNode,
    definedTypeNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getRecordLinkablesVisitor, LinkableDictionary, visit } from '../src';

test('it lists the recorded paths of each linkable kind across programs', () => {
    // Given two programs with one linkable node of each kind.
    const makeProgram = (identifier: string, publicKey: string) =>
        programNode({
            accounts: [accountNode({ identifier: `${identifier}Account` })],
            definedTypes: [definedTypeNode({ identifier: `${identifier}Type`, type: integerTypeNode('u8') })],
            identifier,
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            identifier: `${identifier}Signer`,
                            isSigner: true,
                            isWritable: false,
                        }),
                    ],
                    identifier: `${identifier}Instruction`,
                }),
            ],
            pdas: [pdaNode({ identifier: `${identifier}Pda`, seeds: [] })],
            publicKey,
        });
    const programA = makeProgram('a', '1111');
    const programB = makeProgram('b', '2222');
    const root = rootNode(programA, { additionalPrograms: [programB] });

    // When we record its linkables.
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // Then we can list the full paths of each kind, in recording order.
    const [instructionA, instructionB] = [programA.instructions![0], programB.instructions![0]];
    expect(linkables.getRecordedPathsOfKind('programNode')).toStrictEqual([
        [root, programA],
        [root, programB],
    ]);
    expect(linkables.getRecordedPathsOfKind('accountNode')).toStrictEqual([
        [root, programA, programA.accounts![0]],
        [root, programB, programB.accounts![0]],
    ]);
    expect(linkables.getRecordedPathsOfKind('definedTypeNode')).toStrictEqual([
        [root, programA, programA.definedTypes![0]],
        [root, programB, programB.definedTypes![0]],
    ]);
    expect(linkables.getRecordedPathsOfKind('pdaNode')).toStrictEqual([
        [root, programA, programA.pdas![0]],
        [root, programB, programB.pdas![0]],
    ]);
    expect(linkables.getRecordedPathsOfKind('instructionNode')).toStrictEqual([
        [root, programA, instructionA],
        [root, programB, instructionB],
    ]);
    expect(linkables.getRecordedPathsOfKind('instructionAccountNode')).toStrictEqual([
        [root, programA, instructionA, instructionA.accounts![0]],
        [root, programB, instructionB, instructionB.accounts![0]],
    ]);
});

test('it returns no paths when nothing was recorded', () => {
    expect(new LinkableDictionary().getRecordedPathsOfKind('accountNode')).toStrictEqual([]);
});
