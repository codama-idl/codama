import {
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    type TypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { getResolutionRefs } from '../../src/codegen/get-resolution-refs';

describe('getResolutionRefs', () => {
    test('it names the accounts types', () => {
        const refs = getResolutionRefs([instructionNode({ identifier: 'transfer' })]);
        expect(refs.accountsRef).toBe('TransferAccounts');
        expect(refs.accountsWithDataRef).toBe('TransferAccountsWithData');
    });

    test('it returns no data type for instructions without data to provide', () => {
        const withoutData = getResolutionRefs([instructionNode({ identifier: 'noop' })]);
        const withOmittedData = getResolutionRefs([
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: integerValueNode('1'),
                        defaultValueStrategy: 'omitted',
                        identifier: 'discriminator',
                        type: integerTypeNode('u8'),
                    }),
                ]),
                identifier: 'noop',
            }),
        ]);
        for (const refs of [withoutData, withOmittedData]) {
            expect(refs.dataRef).toBeNull();
            expect(refs.hasData).toBe(false);
            expect(refs.hasRequiredData).toBe(false);
        }
    });

    test('it names the data type after the renderers-js convention', () => {
        const refs = getResolutionRefs([
            instructionNode({
                data: structTypeNode([structFieldTypeNode({ identifier: 'flag', type: booleanTypeNode() })]),
                identifier: 'setFlag',
            }),
        ]);
        expect(refs.dataRef).toBe('SetFlagInstructionDataArgs');
        expect(refs.hasData).toBe(true);
        expect(refs.hasRequiredData).toBe(true);
    });

    test('it does not require data fields with default values or optional types', () => {
        const refs = getResolutionRefs([
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: integerValueNode('5'),
                        identifier: 'fee',
                        type: integerTypeNode('u8'),
                    }),
                    structFieldTypeNode({ identifier: 'memo', type: optionTypeNode(booleanTypeNode()) }),
                ]),
                identifier: 'pay',
            }),
        ]);
        expect(refs.hasData).toBe(true);
        expect(refs.hasRequiredData).toBe(false);
    });

    test('it follows linked data', () => {
        const definedTypes = [
            definedTypeNode({
                identifier: 'args',
                type: structTypeNode([structFieldTypeNode({ identifier: 'flag', type: booleanTypeNode() })]),
            }),
        ];
        const instruction = instructionNode({ data: definedTypeLinkNode('args'), identifier: 'set' });
        const root = rootNode(
            programNode({ definedTypes, identifier: 'p', instructions: [instruction], publicKey: '1111' }),
        );
        const refs = getResolutionRefs([root, root.program, instruction]);
        expect(refs.hasRequiredData).toBe(true);
    });

    test('it follows linked data from other programs', () => {
        // Given data linking to the arguments of another program, which are all optional.
        const args = (type: TypeNode) =>
            definedTypeNode({
                identifier: 'args',
                type: structTypeNode([structFieldTypeNode({ identifier: 'value', type })]),
            });
        const instruction = instructionNode({
            data: definedTypeLinkNode('args', { program: programLinkNode('other') }),
            identifier: 'set',
        });
        const root = rootNode(
            programNode({
                definedTypes: [args(booleanTypeNode())],
                identifier: 'p',
                instructions: [instruction],
                publicKey: '1111',
            }),
            {
                additionalPrograms: [
                    programNode({
                        definedTypes: [args(optionTypeNode(booleanTypeNode()))],
                        identifier: 'other',
                        publicKey: '2222',
                    }),
                ],
            },
        );

        // Then the data is not required, unlike the arguments of the program of the instruction.
        const refs = getResolutionRefs([root, root.program, instruction]);
        expect(refs.hasRequiredData).toBe(false);
    });

    test('it keeps unresolved linked data as required data', () => {
        const refs = getResolutionRefs([instructionNode({ data: definedTypeLinkNode('unknown'), identifier: 'set' })]);
        expect(refs.dataRef).toBe('SetInstructionDataArgs');
        expect(refs.hasRequiredData).toBe(true);
    });
});
