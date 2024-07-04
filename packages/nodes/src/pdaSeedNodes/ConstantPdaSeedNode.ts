import type {
    BytesEncoding,
    ConstantPdaSeedNode,
    ProgramIdValueNode,
    TypeNode,
    ValueNode,
} from '@kinobi-so/node-types';

import { programIdValueNode } from '../contextualValueNodes/ProgramIdValueNode';
import { bytesTypeNode } from '../typeNodes/BytesTypeNode';
import { publicKeyTypeNode } from '../typeNodes/PublicKeyTypeNode';
import { stringTypeNode } from '../typeNodes/StringTypeNode';
import { bytesValueNode } from '../valueNodes/BytesValueNode';
import { stringValueNode } from '../valueNodes/StringValueNode';

export function constantPdaSeedNode<TType extends TypeNode, TValue extends ProgramIdValueNode | ValueNode>(
    type: TType,
    value: TValue,
): ConstantPdaSeedNode<TType, TValue> {
    return Object.freeze({
        kind: 'constantPdaSeedNode',

        // Children.
        type,
        value,
    });
}

export function constantPdaSeedNodeFromProgramId() {
    return constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode());
}

export function constantPdaSeedNodeFromString<TEncoding extends BytesEncoding>(encoding: TEncoding, string: string) {
    return constantPdaSeedNode(stringTypeNode(encoding), stringValueNode(string));
}

export function constantPdaSeedNodeFromBytes<TEncoding extends BytesEncoding>(encoding: TEncoding, data: string) {
    return constantPdaSeedNode(bytesTypeNode(), bytesValueNode(encoding, data));
}
