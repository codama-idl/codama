import { KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, KinobiError } from '@codama/errors';
import {
    booleanTypeNode,
    bytesTypeNode,
    definedTypeLinkNode,
    numberTypeNode,
    publicKeyTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    TypeNode,
} from '@codama/nodes';

import {
    IdlV00Type,
    IdlV00TypeDefTy,
    IdlV00TypeDefTyEnum,
    IdlV00TypeDefTyStruct,
    IdlV00TypeMap,
    IdlV00TypeSet,
    IdlV00TypeTuple,
} from '../idl';
import { arrayTypeNodeFromAnchorV00 } from './ArrayTypeNode';
import { enumTypeNodeFromAnchorV00 } from './EnumTypeNode';
import { mapTypeNodeFromAnchorV00 } from './MapTypeNode';
import { optionTypeNodeFromAnchorV00 } from './OptionTypeNode';
import { setTypeNodeFromAnchorV00 } from './SetTypeNode';
import { structTypeNodeFromAnchorV00 } from './StructTypeNode';
import { tupleTypeNodeFromAnchorV00 } from './TupleTypeNode';

const IDL_V00_TYPE_LEAVES = [
    'string',
    'publicKey',
    'bytes',
    'bool',
    'u8',
    'u16',
    'u32',
    'u64',
    'u128',
    'i8',
    'i16',
    'i32',
    'i64',
    'i128',
    'f32',
    'f64',
    'shortU16',
] as const;

export const typeNodeFromAnchorV00 = (idlType: IdlV00Type | IdlV00TypeDefTy): TypeNode => {
    // Leaf.
    if (typeof idlType === 'string' && IDL_V00_TYPE_LEAVES.includes(idlType)) {
        if (idlType === 'bool') return booleanTypeNode();
        if (idlType === 'publicKey') return publicKeyTypeNode();
        if (idlType === 'string') return sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
        if (idlType === 'bytes') return sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32'));
        return numberTypeNode(idlType);
    }

    // Ensure eveything else is an object.
    if (typeof idlType !== 'object') {
        throw new KinobiError(KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
            idlType: JSON.stringify(idlType),
        });
    }

    // Array.
    if ('array' in idlType && isArrayOfSize(idlType.array, 2)) {
        return arrayTypeNodeFromAnchorV00(idlType);
    }

    // Vec.
    if ('vec' in idlType) {
        return arrayTypeNodeFromAnchorV00(idlType);
    }

    // Defined link.
    if ('defined' in idlType && typeof idlType.defined === 'string') {
        return definedTypeLinkNode(idlType.defined);
    }

    // Enum.
    if ('kind' in idlType && idlType.kind === 'enum' && 'variants' in idlType) {
        return enumTypeNodeFromAnchorV00(idlType as IdlV00TypeDefTyEnum);
    }

    // Map.
    if (
        ('hashMap' in idlType && isArrayOfSize(idlType.hashMap, 2)) ||
        ('bTreeMap' in idlType && isArrayOfSize(idlType.bTreeMap, 2))
    ) {
        return mapTypeNodeFromAnchorV00(idlType as IdlV00TypeMap);
    }

    // Option.
    if ('option' in idlType || 'coption' in idlType) {
        return optionTypeNodeFromAnchorV00(idlType);
    }

    // Set.
    if ('hashSet' in idlType || 'bTreeSet' in idlType) {
        return setTypeNodeFromAnchorV00(idlType as IdlV00TypeSet);
    }

    // Struct.
    if ('kind' in idlType && 'fields' in idlType && idlType.kind === 'struct') {
        return structTypeNodeFromAnchorV00(idlType as IdlV00TypeDefTyStruct);
    }

    // Tuple.
    if ('tuple' in idlType && Array.isArray(idlType.tuple)) {
        return tupleTypeNodeFromAnchorV00(idlType as IdlV00TypeTuple);
    }

    throw new KinobiError(KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
        idlType: JSON.stringify(idlType),
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArrayOfSize(array: any, size: number): boolean {
    return Array.isArray(array) && array.length === size;
}
