import { CodamaError } from '@codama/errors';
import { describe, expect, test } from 'vitest';

import { detectCircularDependency } from '../../../../src/instruction-encoding/resolvers/resolve-account-value-node-address';

describe('detectCircularDependency', () => {
    test('should not throw when no circular dependency exists', () => {
        expect(() => detectCircularDependency('c', ['a', 'b'])).not.toThrow();
    });

    test('should throw AccountError when circular dependency detected', () => {
        expect(() => detectCircularDependency('a', ['a', 'b'])).toThrow(CodamaError);
    });

    test('should include full resolution path in error message', () => {
        expect(() => detectCircularDependency('a', ['a', 'b', 'c'])).toThrow(
            /Circular dependency detected: \[a -> b -> c -> a\]/,
        );
    });

    test('should detect dependency later in the path', () => {
        expect(() => detectCircularDependency('b', ['a', 'b', 'c'])).toThrow(
            /Circular dependency detected: \[a -> b -> c -> b\]/,
        );
    });

    test('should not throw for empty path', () => {
        expect(() => detectCircularDependency('a', [])).not.toThrow();
    });
});
