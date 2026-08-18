import path from 'path';

import { codama } from '../../dist/index.node.mjs';

const configPath = path.join('test', 'exports', 'mock-config.json');
await codama(['run', '-c', configPath]);
