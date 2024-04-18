#!/usr/bin/env zx
import { $ } from 'zx';

// Ensure the code is tree-shakable.
$.stdio = 'inherit';
if ((await $`[[ -f dist/index.browser.js ]]`.exitCode) == 0) {
    await $`agadoo dist/index.browser.js`;
}
if ((await $`[[ -f dist/index.node.js ]]`.exitCode) == 0) {
    await $`agadoo dist/index.node.js`;
}
if ((await $`[[ -f dist/index.react-native.js ]]`.exitCode) == 0) {
    await $`agadoo dist/index.react-native.js`;
}
