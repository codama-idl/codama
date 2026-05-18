import type { Instruction } from '@solana/instructions';
import { describe, expectTypeOf, test } from 'vitest';

import type { BuildIxFn, EitherSigners } from '../../../src/shared/types';

describe('EitherSigners', () => {
    test('should be an array of strings', () => {
        expectTypeOf<EitherSigners>().toEqualTypeOf<string[]>();
    });
});

describe('BuildIxFn', () => {
    test('should return a Promise of Instruction', () => {
        expectTypeOf<BuildIxFn>().returns.toEqualTypeOf<Promise<Instruction>>();
    });

    test('should allow calling with no arguments', () => {
        expectTypeOf<BuildIxFn>().toBeCallableWith();
    });

    test('should accept all four parameters', () => {
        expectTypeOf<BuildIxFn>().toBeCallableWith({}, {}, [], {});
    });
});
