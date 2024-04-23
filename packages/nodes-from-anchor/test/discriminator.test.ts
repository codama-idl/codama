import { bytesValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import { getAnchorAccountDiscriminator, getAnchorInstructionDiscriminator } from '../src/index.js';

test('it can compute the discriminator of an Anchor account', t => {
    // Given an account named "StakeEntry" on the IDL.
    const idlName = 'StakeEntry';

    // When we compute its Anchor discriminator.
    const discriminator = getAnchorAccountDiscriminator(idlName);

    // Then we get the expected value.
    t.deepEqual(discriminator, bytesValueNode('base16', 'bb7f09239b445628'));
});

test('it can compute the discriminator of an Anchor instruction', t => {
    // Given an instruction named "addConfigLines" on the IDL.
    const idlName = 'addConfigLines';

    // When we compute its Anchor discriminator.
    const discriminator = getAnchorInstructionDiscriminator(idlName);

    // Then we get the expected value.
    t.deepEqual(discriminator, bytesValueNode('base16', 'df32e0e39708736a'));
});
