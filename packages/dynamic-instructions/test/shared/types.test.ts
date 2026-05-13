import type { Instruction } from '@solana/instructions';
import { describe, expectTypeOf, test } from 'vitest';

import type { EitherSigners, InstructionsBuilderFn } from '../../src/shared/types';

describe('InstructionsBuilderFn', () => {
    test('should return a Promise of Instruction', () => {
        expectTypeOf<InstructionsBuilderFn>().returns.toEqualTypeOf<Promise<Instruction>>();
    });

    test('should allow calling with no arguments', () => {
        expectTypeOf<InstructionsBuilderFn>().toBeCallableWith();
    });

    test('should accept all four parameters', () => {
        expectTypeOf<InstructionsBuilderFn>().toBeCallableWith({}, {}, [], {});
    });
});

describe('EitherSigners', () => {
    test('should be an array of strings', () => {
        expectTypeOf<EitherSigners>().toEqualTypeOf<string[]>();
    });
});
