import {
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { getResolutionRefs } from '../../src/codegen/get-resolution-refs';

describe('getResolutionRefs', () => {
    test('it names the accounts types', () => {
        const refs = getResolutionRefs(instructionNode({ identifier: 'transfer' }));
        expect(refs.accountsRef).toBe('TransferAccounts');
        expect(refs.accountsWithDataRef).toBe('TransferAccountsWithData');
    });

    test('it returns no data type for instructions without data to provide', () => {
        const withoutData = getResolutionRefs(instructionNode({ identifier: 'noop' }));
        const withOmittedData = getResolutionRefs(
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
        );
        for (const refs of [withoutData, withOmittedData]) {
            expect(refs.dataRef).toBeNull();
            expect(refs.hasData).toBe(false);
            expect(refs.hasRequiredData).toBe(false);
        }
    });

    test('it names the data type after the renderers-js convention', () => {
        const refs = getResolutionRefs(
            instructionNode({
                data: structTypeNode([structFieldTypeNode({ identifier: 'flag', type: booleanTypeNode() })]),
                identifier: 'setFlag',
            }),
        );
        expect(refs.dataRef).toBe('SetFlagInstructionDataArgs');
        expect(refs.hasData).toBe(true);
        expect(refs.hasRequiredData).toBe(true);
    });

    test('it does not require data fields with default values or optional types', () => {
        const refs = getResolutionRefs(
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
        );
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
        const refs = getResolutionRefs(
            instructionNode({ data: definedTypeLinkNode('args'), identifier: 'set' }),
            definedTypes,
        );
        expect(refs.hasRequiredData).toBe(true);
    });

    test('it keeps unresolved linked data as required data', () => {
        const refs = getResolutionRefs(instructionNode({ data: definedTypeLinkNode('unknown'), identifier: 'set' }));
        expect(refs.dataRef).toBe('SetInstructionDataArgs');
        expect(refs.hasRequiredData).toBe(true);
    });
});
