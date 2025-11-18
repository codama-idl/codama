import { ArrayTypeNode, arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode } from '@codama/nodes';

import type { IdlV01TypeArray, IdlV01TypeVec } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function arrayTypeNodeFromAnchorV01(idl: IdlV01TypeArray | IdlV01TypeVec, generics: GenericsV01): ArrayTypeNode {
    if ('array' in idl) {
        const item = typeNodeFromAnchorV01(idl.array[0], generics);
        const size =
            typeof idl.array[1] === 'number' ? idl.array[1] : parseInt(generics.constArgs[idl.array[1].generic].value);
        return arrayTypeNode(item, fixedCountNode(size));
    }

    const item = typeNodeFromAnchorV01(idl.vec, generics);

    return arrayTypeNode(item, prefixedCountNode(numberTypeNode('u32')));
}
