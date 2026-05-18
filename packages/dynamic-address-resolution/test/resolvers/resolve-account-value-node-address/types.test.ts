import { describe, expectTypeOf, test } from 'vitest';

import type { ResolutionPath } from '../../../src/resolvers';

describe('ResolutionPath', () => {
    test('should be a readonly array of strings', () => {
        expectTypeOf<ResolutionPath>().toEqualTypeOf<readonly string[]>();
    });
});
