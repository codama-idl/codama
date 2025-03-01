const path = require('path');
const { codama } = require('../../dist/index.node.cjs');

const configPath = path.join('test', 'exports', 'mock-config.json');
codama(['run', '-c', configPath]);
