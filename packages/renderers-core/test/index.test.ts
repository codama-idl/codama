import { expect, test } from 'vitest';

import { writeRenderMapVisitor } from '../src';

/**
 * `@codama/renderers-core` is now a thin layer over `@codama/fragments`
 * — every name except {@link writeRenderMapVisitor} is forwarded
 * straight through via `export *`. The fragments-side tests cover the
 * underlying primitives; this single assertion is the smoke check
 * that the renderer-specific addition is reachable through the
 * package entry point.
 */
test('it exports writeRenderMapVisitor as a function', () => {
    expect(typeof writeRenderMapVisitor).toBe('function');
});
