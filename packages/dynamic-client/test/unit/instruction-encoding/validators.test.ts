import type { InstructionArgumentNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createIxArgumentsValidator } from '../../../src/instruction-encoding/validators';

describe('Validators', () => {
    test('should throw for unsupported TypeNode kind', () => {
        const fakeIxArguments = [
            {
                name: 'testArg',
                type: { kind: 'fooBarTypeNode' },
            },
        ] as unknown as InstructionArgumentNode[];

        expect(() => createIxArgumentsValidator('testInstruction', fakeIxArguments, [])).toThrow(
            'Validator for TypeNode "testInstruction_testArg_0" kind: fooBarTypeNode is not implemented!',
        );
    });
});
