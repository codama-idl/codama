#!/usr/bin/env zx
import { $, path } from 'zx';

import { handleDirectory as addJsExtensionsToTypes } from './add-js-extension-to-types.mjs';

// Build the types only.
$.stdio = 'inherit';
await $`tsc -p ./tsconfig.declarations.json`;
addJsExtensionsToTypes(path.join('dist', 'types'));
