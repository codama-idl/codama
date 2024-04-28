import test from 'ava';

import { renderJavaScriptUmiVisitor, renderJavaScriptVisitor, renderRustVisitor } from '../src/index.js';

test('it exports the visitor of all renderers', t => {
    t.is(typeof renderJavaScriptVisitor, 'function');
    t.is(typeof renderJavaScriptUmiVisitor, 'function');
    t.is(typeof renderRustVisitor, 'function');
});
