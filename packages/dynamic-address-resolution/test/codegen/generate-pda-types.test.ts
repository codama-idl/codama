import {
    constantPdaSeedNodeFromString,
    instructionAccountNode,
    instructionNode,
    pdaNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    stringTypeNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { generatePdaTypes } from '../../src/codegen/generate-pda-types';

describe('generatePdaTypes', () => {
    test('should return null mapTypeName when there are no PDAs', () => {
        const root = rootNode(
            programNode({
                identifier: 'noPdaProgram',
                instructions: [],
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const { mapTypeName, typeBlock } = generatePdaTypes(root);
        expect(mapTypeName).toBeNull();
        expect(typeBlock).toBe('');
    });

    test('should emit seed types and aggregate map for PDAs', () => {
        const pda = pdaNode({
            identifier: 'config',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'config'),
                variablePdaSeedNode('authority', publicKeyTypeNode()),
            ],
        });
        const root = rootNode(
            programNode({
                identifier: 'myProgram',
                instructions: [],
                pdas: [pda],
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const { mapTypeName, typeBlock } = generatePdaTypes(root);
        expect(mapTypeName).toBe('MyProgramPdas');
        expect(typeBlock).toContain('export type ConfigSeeds');
        expect(typeBlock).toContain('authority: Address;');
        expect(typeBlock).toContain('export type MyProgramPdas');
        expect(typeBlock).toContain(
            'config: (seeds: ConfigSeeds, options?: { programId?: Address }) => Promise<ProgramDerivedAddress>;',
        );
    });

    test('should discover inline PDAs on instruction account defaults', () => {
        const inlinePda = pdaNode({
            identifier: 'inline',
            seeds: [variablePdaSeedNode('mint', publicKeyTypeNode())],
        });
        const root = rootNode(
            programNode({
                identifier: 'inlineProgram',
                instructions: [
                    instructionNode({
                        accounts: [
                            instructionAccountNode({
                                defaultValue: pdaValueNode(inlinePda),
                                identifier: 'inlineAccount',
                                isSigner: false,
                                isWritable: true,
                            }),
                        ],
                        identifier: 'doThing',
                    }),
                ],
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const { mapTypeName, typeBlock } = generatePdaTypes(root);
        expect(mapTypeName).toBe('InlineProgramPdas');
        expect(typeBlock).toContain('export type InlineSeeds');
        expect(typeBlock).toContain(
            'inline: (seeds: InlineSeeds, options?: { programId?: Address }) => Promise<ProgramDerivedAddress>;',
        );
    });

    test('should emit seedless variant for PDAs with only constant seeds', () => {
        const pda = pdaNode({
            identifier: 'fixed',
            seeds: [constantPdaSeedNodeFromString('utf8', 'fixed')],
        });
        const root = rootNode(
            programNode({
                identifier: 'fixedProgram',
                instructions: [],
                pdas: [pda],
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const { typeBlock } = generatePdaTypes(root);
        expect(typeBlock).not.toContain('FixedSeeds');
        expect(typeBlock).toContain(
            'fixed: (seeds?: Record<string, unknown>, options?: { programId?: Address }) => Promise<ProgramDerivedAddress>;',
        );
    });

    test('should use string seed type', () => {
        const pda = pdaNode({
            identifier: 'named',
            seeds: [variablePdaSeedNode('label', stringTypeNode('utf8'))],
        });
        const root = rootNode(
            programNode({
                identifier: 'namedProgram',
                instructions: [],
                pdas: [pda],
                publicKey: '11111111111111111111111111111111',
            }),
        );
        const { typeBlock } = generatePdaTypes(root);
        expect(typeBlock).toContain('label: string;');
    });
});
