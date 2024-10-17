import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-tests';

import { solanaDummy } from '../src/index.js';

export const createUmi = async () => (await baseCreateUmi()).use(solanaDummy());
