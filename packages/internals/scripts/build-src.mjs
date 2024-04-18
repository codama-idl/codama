#!/usr/bin/env zx
import { $, argv } from 'zx';

// Build the source code using the provided build type.
// - `library` for the main library build which includes a minified iife build.
// - `package` for sub-package builds.

$.stdio = 'inherit';
const flags = ['--config', `internals/tsup.config.${argv._[0]}.ts`];
await $`tsup ${flags}`;
