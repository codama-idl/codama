#!/usr/bin/env zx
import { $, argv } from 'zx';

// Lint and format the code.
$.stdio = 'inherit';
if (argv.fix) {
    await $`pnpm eslint --fix . && pnpm prettier --log-level warn --ignore-unknown --write ./*`;
} else {
    await $`pnpm eslint . && pnpm prettier --check .`;
}
