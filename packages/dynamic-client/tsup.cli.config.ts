import { defineConfig } from 'tsup';

import { getCliBuildConfig } from '../../tsup.config.base';

export default defineConfig([getCliBuildConfig()]);
