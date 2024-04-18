#!/usr/bin/env zx
import { $ } from 'zx';

// Ensure the code type checks.
$.stdio = 'inherit';
await $`tsc --noEmit`;
