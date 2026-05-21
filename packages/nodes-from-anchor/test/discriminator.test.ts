import { bytesValueNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import {
    getAnchorAccountDiscriminatorV00,
    getAnchorEventDiscriminatorV00,
    getAnchorInstructionDiscriminatorV00,
} from '../src/index.js';

test('it can compute the discriminator of an Anchor account', () => {
    // Given an account named "StakeEntry" on the IDL.
    const idlName = 'StakeEntry';

    // When we compute its Anchor discriminator.
    const discriminator = getAnchorAccountDiscriminatorV00(idlName);

    // Then we get the expected value.
    expect(discriminator).toEqual(bytesValueNode('base16', 'bb7f09239b445628'));
});

test('it can compute the discriminator of an Anchor event', () => {
    // Given an event named "MyEvent" on the IDL.
    const idlName = 'MyEvent';

    // When we compute its Anchor discriminator.
    const discriminator = getAnchorEventDiscriminatorV00(idlName);

    // Then we get the expected value.
    expect(discriminator).toEqual(bytesValueNode('base16', '60b8c5f38b025a94'));
});

test('it can compute the discriminator of an Anchor instruction', () => {
    // Given an instruction named "addConfigLines" on the IDL.
    const idlName = 'addConfigLines';

    // When we compute its Anchor discriminator.
    const discriminator = getAnchorInstructionDiscriminatorV00(idlName);

    // Then we get the expected value.
    expect(discriminator).toEqual(bytesValueNode('base16', 'df32e0e39708736a'));
});
