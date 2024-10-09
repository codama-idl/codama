import {
    fixedCountNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
    SetTypeNode,
    setTypeNode,
} from '@codama/nodes';

import { IdlV00TypeSet } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function setTypeNodeFromAnchorV00(idl: IdlV00TypeSet): SetTypeNode {
    const child = 'hashSet' in idl ? idl.hashSet : idl.bTreeSet;
    let size: SetTypeNode['count'] | undefined;
    if (idl.size === 'remainder') {
        size = remainderCountNode();
    } else if (typeof idl.size === 'number') {
        size = fixedCountNode(idl.size);
    } else {
        size = prefixedCountNode(numberTypeNode(idl.size ?? 'u32'));
    }
    return setTypeNode(typeNodeFromAnchorV00(child), size);
}
