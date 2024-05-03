#!/usr/bin/env zx
import { $ } from 'zx';

// Ensure the code is tree-shakable.
$.stdio = 'inherit';
if ((await $`[[ -f dist/index.browser.mjs ]]`.exitCode) == 0) {
    await $`agadoo dist/index.browser.mjs`;
}
if ((await $`[[ -f dist/index.node.mjs ]]`.exitCode) == 0) {
    await $`agadoo dist/index.node.mjs`;
}
if ((await $`[[ -f dist/index.react-native.mjs ]]`.exitCode) == 0) {
    await $`agadoo dist/index.react-native.mjs`;
}
