import type { BytesEncoding } from '@codama/node-types';

import { bytesTypeNode } from './generated/typeNodes/BytesTypeNode';
import { stringTypeNode } from './generated/typeNodes/StringTypeNode';
import { bytesValueNode } from './generated/valueNodes/BytesValueNode';
import { constantValueNode } from './generated/valueNodes/ConstantValueNode';
import { stringValueNode } from './generated/valueNodes/StringValueNode';

export function constantValueNodeFromString<TEncoding extends BytesEncoding>(encoding: TEncoding, string: string) {
    return constantValueNode(stringTypeNode(encoding), stringValueNode(string));
}

export function constantValueNodeFromBytes<TEncoding extends BytesEncoding>(encoding: TEncoding, data: string) {
    return constantValueNode(bytesTypeNode(), bytesValueNode(encoding, data));
}
