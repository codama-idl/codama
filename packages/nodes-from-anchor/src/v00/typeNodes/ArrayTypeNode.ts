import {
    ArrayTypeNode,
    arrayTypeNode,
    fixedCountNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
} from '@kinobi-so/nodes';

import { IdlV00TypeArray, IdlV00TypeVec } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function arrayTypeNodeFromAnchorV00(idl: IdlV00TypeArray | IdlV00TypeVec): ArrayTypeNode {
    if ('array' in idl) {
        const item = typeNodeFromAnchorV00(idl.array[0]);
        return arrayTypeNode(item, fixedCountNode(idl.array[1]));
    }
    const item = typeNodeFromAnchorV00(idl.vec);
    if (idl.size === 'remainder') return arrayTypeNode(item, remainderCountNode());
    return arrayTypeNode(item, prefixedCountNode(numberTypeNode(idl.size ?? 'u32')));
}
