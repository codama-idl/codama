import { describe, expect, it } from 'vitest';

import { getTypeParameterIdentifierFragment } from '../../../src/nodeTypes/fragments/typeParameterIdentifier';

describe('getTypeParameterIdentifierFragment', () => {
    it('prefixes the attribute name with `T` and PascalCases it', () => {
        expect(getTypeParameterIdentifierFragment('data').content).toBe('TData');
        expect(getTypeParameterIdentifierFragment('pda').content).toBe('TPda');
        expect(getTypeParameterIdentifierFragment('subInstructions').content).toBe('TSubInstructions');
    });

    it('produces a fragment with no imports', () => {
        expect(getTypeParameterIdentifierFragment('data').imports.size).toBe(0);
    });
});
