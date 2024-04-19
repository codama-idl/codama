import test from 'ava';

import { rootNode } from '../src/index.js';

test('it exports node helpers', t => {
    t.is(typeof rootNode, 'function');
});
