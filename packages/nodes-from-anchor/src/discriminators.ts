import { BytesValueNode, bytesValueNode, pascalCase, snakeCase } from '@codama/nodes';
import { sha256 } from '@noble/hashes/sha2.js';
import { getUtf8Codec } from '@solana/codecs';

import { hex } from './utils';

export const getAnchorDiscriminatorV01 = (discriminator: number[]): BytesValueNode => {
    return bytesValueNode('base16', hex(new Uint8Array(discriminator)));
};

export const getAnchorInstructionDiscriminatorV00 = (idlName: string): BytesValueNode => {
    const bytes = getUtf8Codec().encode(`global:${snakeCase(idlName)}`);
    const hash = sha256(bytes as Uint8Array).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};

export const getAnchorAccountDiscriminatorV00 = (idlName: string): BytesValueNode => {
    const bytes = getUtf8Codec().encode(`account:${pascalCase(idlName)}`);
    const hash = sha256(bytes as Uint8Array).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};
