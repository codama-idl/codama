// Run with `--no-experimental-require-module` to ensure the CommonJS builds
// do not rely on `require(esm)` to load ESM-only dependencies.
const assert = require('assert');

for (const file of ['../../dist/index.node.cjs', '../../dist/index.browser.cjs']) {
    const { getAnchorAccountDiscriminatorV00 } = require(file);
    assert.deepStrictEqual(getAnchorAccountDiscriminatorV00('StakeEntry'), {
        data: 'bb7f09239b445628',
        encoding: 'base16',
        kind: 'bytesValueNode',
    });
}
