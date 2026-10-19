import { CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, CodamaError } from '@codama/errors';
import { instructionAccountNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { detectCircularDependency } from '../../../src/resolvers/resolve-account-value-node-address';

const instruction = instructionNode({ identifier: 'myInstruction' });
const entry = (key: string) => ({
    key,
    path: [instruction, instructionAccountNode({ identifier: key, isSigner: false, isWritable: false })],
});
const [a, b, c] = [entry('a'), entry('b'), entry('c')];
const context = (...resolutionPath: ReturnType<typeof entry>[]) => ({
    instructionPath: [instruction] as const,
    resolutionPath,
});

describe('detectCircularDependency', () => {
    test('should not throw when no circular dependency exists', () => {
        expect(() => detectCircularDependency(c, context(a, b))).not.toThrow();
    });

    test('should throw with the full resolution path when circular dependency detected', () => {
        expect(() => detectCircularDependency(a, context(a, b, c))).toThrow(
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, {
                cycle: [a.path, b.path, c.path, a.path],
                formattedCycle: 'a -> b -> c -> a',
                path: [instruction],
            }),
        );
    });

    test('should detect dependency later in the path', () => {
        expect(() => detectCircularDependency(b, context(a, b, c))).toThrow(
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, {
                cycle: [a.path, b.path, c.path, b.path],
                formattedCycle: 'a -> b -> c -> b',
                path: [instruction],
            }),
        );
    });

    test('should not throw for empty path', () => {
        expect(() => detectCircularDependency(a, context())).not.toThrow();
    });
});
