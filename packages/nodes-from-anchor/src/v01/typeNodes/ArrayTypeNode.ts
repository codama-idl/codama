import { ArrayTypeNode, arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode } from '@codama/nodes';

import { IdlV01TypeArray, IdlV01TypeVec } from '../idl';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function arrayTypeNodeFromAnchorV01(idl: IdlV01TypeArray | IdlV01TypeVec): ArrayTypeNode {
    if ('array' in idl) {
        const item = typeNodeFromAnchorV01(idl.array[0]);
        return arrayTypeNode(item, fixedCountNode(idl.array[1] as number));
    }

    const item = typeNodeFromAnchorV01(idl.vec);

    return arrayTypeNode(item, prefixedCountNode(numberTypeNode('u32')));
}
