import { expect, test } from 'vitest';

import { renderJavaScriptUmiVisitor, renderJavaScriptVisitor, renderRustVisitor } from '../src';

test('it exports the visitor of all renderers', () => {
    expect(renderJavaScriptVisitor).toBeTypeOf('function');
    expect(renderJavaScriptUmiVisitor).toBeTypeOf('function');
    expect(renderRustVisitor).toBeTypeOf('function');
});
