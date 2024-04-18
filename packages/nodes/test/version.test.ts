import test from 'ava';

import { getVersion } from '../src/index.js';

test('it return the right version', t => {
    t.is(getVersion(), '0.20.0');
});
