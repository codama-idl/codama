import test from 'ava';

import { getInfo } from '../src/index.js';

if (__BROWSER__) {
    test('it returns browser info', t => {
        t.is(getInfo(), 'Platform: browser, Version: 0.20.0');
    });
} else if (__REACTNATIVE__) {
    test('it returns react native info', t => {
        t.is(getInfo(), 'Platform: react-native, Version: 0.20.0');
    });
} else {
    test('it returns node info', t => {
        t.is(getInfo(), 'Platform: node, Version: 0.20.0');
    });
}
