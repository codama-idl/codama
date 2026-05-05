import { bytesTypeNode, ConstantNode, constantNode, stringTypeNode } from '@codama/nodes';

import { parseConstantValue } from '../utils';
import { IdlV00Constant } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes/TypeNode';

export function constantNodeFromAnchorV00(idl: Partial<IdlV00Constant>): ConstantNode {
    const name = idl.name ?? '';
    const valueString = idl.value ?? '';

    const declaredType =
        idl.type === 'bytes' ? bytesTypeNode() : idl.type ? typeNodeFromAnchorV00(idl.type) : stringTypeNode('utf8');

    const { type, value } = parseConstantValue(valueString, declaredType);
    return constantNode(name, type, value);
}
