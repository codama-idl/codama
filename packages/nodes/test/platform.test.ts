import test from 'ava';

import { getPlatform } from '../src/index.js';

if (__BROWSER__) {
    test('it returns the browser platform', t => {
        t.is(getPlatform(), 'browser');
    });
} else if (__REACTNATIVE__) {
    test('it returns the react native platform', t => {
        t.is(getPlatform(), 'react-native');
    });
} else {
    test('it returns the node platform', t => {
        t.is(getPlatform(), 'node');
    });
}
