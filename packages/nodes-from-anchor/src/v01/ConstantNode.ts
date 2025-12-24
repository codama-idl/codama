import { ConstantNode, constantNode, numberTypeNode, stringTypeNode } from '@codama/nodes';

import { parseConstantValue } from '../utils';
import { IdlV01Const } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes/TypeNode';

export function constantNodeFromAnchorV01(idl: Partial<IdlV01Const>): ConstantNode {
    const name = idl.name ?? '';
    const valueString = idl.value ?? '';

    // For constants, 'bytes' type represents a raw byte array, not a sized string
    // so we use u8 to represent the type of each element
    const type =
        idl.type === 'bytes'
            ? numberTypeNode('u8')
            : idl.type
              ? typeNodeFromAnchorV01(idl.type, { constArgs: {}, typeArgs: {}, types: {} })
              : stringTypeNode('utf8');

    return constantNode(name, type, parseConstantValue(valueString));
}
