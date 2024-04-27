import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-tests';

import { solanaMemo } from '../src/index.js';

export const createUmi = async () => (await baseCreateUmi()).use(solanaMemo());
