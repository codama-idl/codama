import type { BytesEncoding, ConstantValueNode, TypeNode, ValueNode } from '@codama/node-types';

import { bytesTypeNode, stringTypeNode } from '../typeNodes';
import { bytesValueNode } from './BytesValueNode';
import { stringValueNode } from './StringValueNode';

export function constantValueNode<TType extends TypeNode, TValue extends ValueNode>(
    type: TType,
    value: TValue,
): ConstantValueNode<TType, TValue> {
    return Object.freeze({
        kind: 'constantValueNode',

        // Children.
        type,
        value,
    });
}

export function constantValueNodeFromString<TEncoding extends BytesEncoding>(encoding: TEncoding, string: string) {
    return constantValueNode(stringTypeNode(encoding), stringValueNode(string));
}

export function constantValueNodeFromBytes<TEncoding extends BytesEncoding>(encoding: TEncoding, data: string) {
    return constantValueNode(bytesTypeNode(), bytesValueNode(encoding, data));
}
