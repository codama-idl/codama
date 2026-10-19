import { expect, test } from 'vitest';

import * as rendererCore from '../src';
import { writeIdlVisitor, writeRenderMapVisitor } from '../src';

/**
 * `@codama/renderers-core` only exposes the renderer-specific visitors
 * built on top of `@codama/fragments`. These assertions are the smoke
 * check that they are reachable through the package entry point.
 */
test('it exports writeRenderMapVisitor as a function', () => {
    expect(typeof writeRenderMapVisitor).toBe('function');
});

test('it exports writeIdlVisitor as a function', () => {
    expect(typeof writeIdlVisitor).toBe('function');
});

test('it does not re-export the @codama/fragments API', () => {
    expect(Object.keys(rendererCore).sort()).toEqual(['writeIdlVisitor', 'writeRenderMapVisitor']);
});
