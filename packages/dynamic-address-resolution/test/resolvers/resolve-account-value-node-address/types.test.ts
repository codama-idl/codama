import type { NodePath } from 'codama';
import { describe, expectTypeOf, test } from 'vitest';

import type { ResolutionPath } from '../../../src/resolvers';

describe('ResolutionPath', () => {
    test('should be a readonly array of keys with the paths of their nodes', () => {
        expectTypeOf<ResolutionPath>().toEqualTypeOf<readonly { key: string; path: NodePath }[]>();
    });
});
