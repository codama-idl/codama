import { expect, test } from 'vitest';

import { writeIdlVisitor, writeRenderMapVisitor } from '../src';

/**
 * `@codama/renderers-core` is now a thin layer over `@codama/fragments`
 * — every name except {@link writeRenderMapVisitor} and
 * {@link writeIdlVisitor} is forwarded straight through via
 * `export *`. The fragments-side tests cover the underlying
 * primitives; these assertions are the smoke check that the
 * renderer-specific additions are reachable through the package entry
 * point.
 */
test('it exports writeRenderMapVisitor as a function', () => {
    expect(typeof writeRenderMapVisitor).toBe('function');
});

test('it exports writeIdlVisitor as a function', () => {
    expect(typeof writeIdlVisitor).toBe('function');
});
