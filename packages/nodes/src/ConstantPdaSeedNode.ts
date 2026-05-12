import type { BytesEncoding } from '@codama/node-types';

import { programIdValueNode } from './generated/contextualValueNodes/ProgramIdValueNode';
import { constantPdaSeedNode } from './generated/pdaSeedNodes/ConstantPdaSeedNode';
import { bytesTypeNode } from './generated/typeNodes/BytesTypeNode';
import { publicKeyTypeNode } from './generated/typeNodes/PublicKeyTypeNode';
import { stringTypeNode } from './generated/typeNodes/StringTypeNode';
import { bytesValueNode } from './generated/valueNodes/BytesValueNode';
import { stringValueNode } from './generated/valueNodes/StringValueNode';

export function constantPdaSeedNodeFromProgramId() {
    return constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode());
}

export function constantPdaSeedNodeFromString<TEncoding extends BytesEncoding>(encoding: TEncoding, string: string) {
    return constantPdaSeedNode(stringTypeNode(encoding), stringValueNode(string));
}

export function constantPdaSeedNodeFromBytes<TEncoding extends BytesEncoding>(encoding: TEncoding, data: string) {
    return constantPdaSeedNode(bytesTypeNode(), bytesValueNode(encoding, data));
}
