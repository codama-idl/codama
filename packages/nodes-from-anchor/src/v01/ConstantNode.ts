import { bytesTypeNode, ConstantNode, constantNode, stringTypeNode } from '@codama/nodes';

import { parseConstantValue } from '../utils';
import { IdlV01Const } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes/TypeNode';
import { GenericsV01 } from './unwrapGenerics';

export function constantNodeFromAnchorV01(idl: Partial<IdlV01Const>, generics: GenericsV01): ConstantNode {
    const name = idl.name ?? '';
    const valueString = idl.value ?? '';

    const declaredType =
        idl.type === 'bytes'
            ? bytesTypeNode()
            : idl.type
              ? typeNodeFromAnchorV01(idl.type, generics)
              : stringTypeNode('utf8');

    const { type, value } = parseConstantValue(valueString, declaredType);
    return constantNode(name, type, value);
}
