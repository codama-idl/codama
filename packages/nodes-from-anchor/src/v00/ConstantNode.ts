import { ConstantNode, constantNode, numberTypeNode, stringTypeNode } from '@codama/nodes';

import { parseConstantValue } from '../utils';
import { IdlV00Constant } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes/TypeNode';

export function constantNodeFromAnchorV00(idl: Partial<IdlV00Constant>): ConstantNode {
    const name = idl.name ?? '';
    const valueString = idl.value ?? '';

    // For constants, 'bytes' type represents a raw byte array, not a sized string
    // so we use u8 to represent the type of each element
    const type =
        idl.type === 'bytes'
            ? numberTypeNode('u8')
            : idl.type
              ? typeNodeFromAnchorV00(idl.type)
              : stringTypeNode('utf8');

    return constantNode(name, type, parseConstantValue(valueString));
}
