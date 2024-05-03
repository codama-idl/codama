#!/usr/bin/env zx
import { $, argv } from 'zx';

$.stdio = 'inherit';
const platform = argv._[0];
const watch = argv.watch;

const testArgs = ['--config', `../../node_modules/@kinobi-so/internals/vitest.config.${platform}.mts`];

if (watch) {
    await $`vitest ${testArgs}`;
} else {
    await $`vitest run ${testArgs}`;
}
