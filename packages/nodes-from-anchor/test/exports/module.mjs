import assert from 'assert';

import * as browser from '../../dist/index.browser.mjs';
import * as node from '../../dist/index.node.mjs';

for (const { getAnchorAccountDiscriminatorV00 } of [node, browser]) {
    assert.deepStrictEqual(getAnchorAccountDiscriminatorV00('StakeEntry'), {
        data: 'bb7f09239b445628',
        encoding: 'base16',
        kind: 'bytesValueNode',
    });
}
