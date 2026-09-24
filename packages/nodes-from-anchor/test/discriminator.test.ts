import { bytesValueNode } from '@codama/nodes';
import { sha256 } from '@noble/hashes/sha2.js';
import { expect, test } from 'vitest';

import {
    getAnchorAccountDiscriminatorV00,
    getAnchorEventDiscriminatorV00,
    getAnchorInstructionDiscriminatorV00,
} from '../src/index.js';
import { hex } from '../src/utils';

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

const hashPreimage = (preimage: string) =>
    bytesValueNode('base16', hex(sha256(new TextEncoder().encode(preimage)).slice(0, 8)));

test('it matches the known discriminator of the Anchor "initialize" instruction', () => {
    expect(getAnchorInstructionDiscriminatorV00('initialize')).toEqual(bytesValueNode('base16', 'afaf6d1f0d989bed'));
});

test.each([
    ['addConfigLines', 'global:add_config_lines'],
    ['transferV2', 'global:transfer_v2'],
    ['setHTTPConfig', 'global:set_http_config'],
    ['getURL', 'global:get_url'],
])('it hashes the Anchor snake_case name of the "%s" instruction', (idlName, preimage) => {
    expect(getAnchorInstructionDiscriminatorV00(idlName)).toEqual(hashPreimage(preimage));
});

test.each([
    ['StakeEntry', 'account:StakeEntry'],
    ['stakeEntry', 'account:StakeEntry'],
    ['HTTPConfig', 'account:HTTPConfig'],
    ['TokenV2', 'account:TokenV2'],
])('it hashes the Anchor struct name of the "%s" account, preserving acronyms', (idlName, preimage) => {
    expect(getAnchorAccountDiscriminatorV00(idlName)).toEqual(hashPreimage(preimage));
});

test('it hashes the Anchor struct name of an event, preserving acronyms', () => {
    expect(getAnchorEventDiscriminatorV00('NFTMinted')).toEqual(hashPreimage('event:NFTMinted'));
});
