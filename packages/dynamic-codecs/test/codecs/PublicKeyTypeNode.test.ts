import { publicKeyTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes as a base58 string', () => {
    const codec = getNodeCodec([publicKeyTypeNode()]);
    expect(codec.encode('LorisCg1FTs89a32VSrFskYDgiRbNQzct1WxyZb7nuA')).toStrictEqual(
        hex('0513045e052f4919b608963de73c666e0672e06e28140ab841bff1cc83a178b5'),
    );
    expect(codec.decode(hex('0513045e052f4919b608963de73c666e0672e06e28140ab841bff1cc83a178b5'))).toBe(
        'LorisCg1FTs89a32VSrFskYDgiRbNQzct1WxyZb7nuA',
    );
});
