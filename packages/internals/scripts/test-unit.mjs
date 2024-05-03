#!/usr/bin/env zx
import { $, argv } from 'zx';

$.stdio = 'inherit';
const platform = argv._[0];
const watch = argv.watch;

// Prepare build and test arguments.
const buildArgs = ['--config', `internals/tsup.config.tests.${platform}.ts`];
// const esmTestArgs = ['--config', `../../node_modules/@kinobi-so/internals/ava.config.${platform}-esm.mjs`];
const cjsTestArgs = ['--config', `../../node_modules/@kinobi-so/internals/ava.config.${platform}-cjs.mjs`];

if (watch) {
    // Build and run the tests concurrently in watch mode.
    await $`concurrently "tsup ${buildArgs} --watch" "ava ${cjsTestArgs} --watch" --hide 0 --prefix none --kill-others`;
} else {
    // Build and run the tests.
    await $`tsup ${buildArgs}`;
    // await $`ava ${esmTestArgs}`;
    if (platform !== 'react-native') {
        await $`ava ${cjsTestArgs}`;
    }
}
