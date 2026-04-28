import { bytesTypeNode, ConstantNode, constantNode, stringTypeNode } from '@codama/nodes';

import { parseConstantValue } from '../utils';
import { IdlV01Const } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes/TypeNode';

export function constantNodeFromAnchorV01(idl: Partial<IdlV01Const>): ConstantNode {
    const name = idl.name ?? '';
    const valueString = idl.value ?? '';

    const declaredType =
        idl.type === 'bytes'
            ? bytesTypeNode()
            : idl.type
              ? typeNodeFromAnchorV01(idl.type, { constArgs: {}, typeArgs: {}, types: {} })
              : stringTypeNode('utf8');

    const { type, value } = parseConstantValue(valueString, declaredType);
    return constantNode(name, type, value);
}
