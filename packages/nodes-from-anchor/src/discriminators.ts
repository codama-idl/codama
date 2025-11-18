import { BytesValueNode, bytesValueNode, pascalCase, snakeCase } from '@codama/nodes';
import { sha256 } from '@noble/hashes/sha2';

import { hex } from './utils';

export const getAnchorDiscriminatorV01 = (discriminator: number[]): BytesValueNode => {
    return bytesValueNode('base16', hex(new Uint8Array(discriminator)));
};

export const getAnchorInstructionDiscriminatorV00 = (idlName: string): BytesValueNode => {
    const hash = sha256(`global:${snakeCase(idlName)}`).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};

export const getAnchorAccountDiscriminatorV00 = (idlName: string): BytesValueNode => {
    const hash = sha256(`account:${pascalCase(idlName)}`).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};
