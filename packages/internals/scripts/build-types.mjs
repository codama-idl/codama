#!/usr/bin/env zx
import { $ } from 'zx';

// Build the types only.
$.stdio = 'inherit';
await $`tsc -p ./tsconfig.declarations.json`;
