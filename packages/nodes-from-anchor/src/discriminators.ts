import { BytesValueNode, bytesValueNode, pascalCase, snakeCase } from '@kinobi-so/nodes';
import { sha256 } from '@noble/hashes/sha256';

export const getAnchorInstructionDiscriminator = (idlName: string): BytesValueNode => {
    const hash = sha256(`global:${snakeCase(idlName)}`).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};

export const getAnchorAccountDiscriminator = (idlName: string): BytesValueNode => {
    const hash = sha256(`account:${pascalCase(idlName)}`).slice(0, 8);
    return bytesValueNode('base16', hex(hash));
};

function hex(bytes: Uint8Array): string {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
