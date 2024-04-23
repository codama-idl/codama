import {
    CountNode,
    fixedCountNode,
    MapTypeNode,
    mapTypeNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
} from '@kinobi-so/nodes';

import { IdlV00TypeMap } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function mapTypeNodeFromAnchorV00(idl: IdlV00TypeMap): MapTypeNode {
    const [key, value] = 'hashMap' in idl ? idl.hashMap : idl.bTreeMap;
    let size: CountNode | undefined;
    if (idl.size === 'remainder') {
        size = remainderCountNode();
    } else if (typeof idl.size === 'number') {
        size = fixedCountNode(idl.size);
    } else {
        size = prefixedCountNode(numberTypeNode(idl.size ?? 'u32'));
    }
    return mapTypeNode(typeNodeFromAnchorV00(key), typeNodeFromAnchorV00(value), size);
}
