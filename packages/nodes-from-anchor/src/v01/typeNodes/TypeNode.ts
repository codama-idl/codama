import { KINOBI_ERROR__UNRECOGNIZED_ANCHOR_IDL_TYPE, KinobiError } from '@kinobi-so/errors';
import {
    booleanTypeNode,
    bytesTypeNode,
    definedTypeLinkNode,
    numberTypeNode,
    publicKeyTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    TypeNode,
} from '@kinobi-so/nodes';

import {
    IdlV01DefinedFieldsTuple,
    IdlV01Type,
    IdlV01TypeCOption,
    IdlV01TypeDefTy,
    IdlV01TypeDefTyEnum,
    IdlV01TypeDefTyStruct,
    IdlV01TypeOption,
} from '../idl';
import { arrayTypeNodeFromAnchorV01 } from './ArrayTypeNode';
import { enumTypeNodeFromAnchorV01 } from './EnumTypeNode';
import { optionTypeNodeFromAnchorV01 } from './OptionTypeNode';
import { structTypeNodeFromAnchorV01 } from './StructTypeNode';
import { tupleTypeNodeFromAnchorV01 } from './TupleTypeNode';

const IDL_V01_TYPE_LEAVES = [
    'string',
    'pubkey',
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

export const typeNodeFromAnchorV01 = (idlType: IdlV01Type | IdlV01TypeDefTy): TypeNode => {
    // Leaf.
    if (typeof idlType === 'string' && IDL_V01_TYPE_LEAVES.includes(idlType)) {
        if (idlType === 'bool') return booleanTypeNode();
        if (idlType === 'pubkey') return publicKeyTypeNode();
        if (idlType === 'string') return sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
        if (idlType === 'bytes') return sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32'));
        return numberTypeNode(idlType);
    }

    // Ensure eveything else is an object.
    if (typeof idlType !== 'object') {
        throw new KinobiError(KINOBI_ERROR__UNRECOGNIZED_ANCHOR_IDL_TYPE, {
            idlType: JSON.stringify(idlType),
        });
    }

    // Array.
    if ('array' in idlType && isArrayOfSize(idlType.array, 2)) {
        return arrayTypeNodeFromAnchorV01(idlType);
    }

    // Vec.
    if ('vec' in idlType) {
        return arrayTypeNodeFromAnchorV01(idlType);
    }

    // Defined link.
    // TODO: Support generics.
    if ('defined' in idlType && typeof idlType.defined === 'object') {
        return definedTypeLinkNode(idlType.defined.name);
    }

    // Enum.
    if ('kind' in idlType && idlType.kind === 'enum' && 'variants' in idlType) {
        return enumTypeNodeFromAnchorV01(idlType as IdlV01TypeDefTyEnum);
    }

    // Option.
    if ('option' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType as IdlV01TypeOption);
    }

    if ('coption' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType as IdlV01TypeCOption);
    }

    // Struct.
    if ('kind' in idlType && 'fields' in idlType && idlType.kind === 'struct') {
        // TODO: bug here where struct type field is getting handled as a tuple if it has 2 fields
        if (isArrayOfSize(idlType.fields, 2)) {
            return tupleTypeNodeFromAnchorV01(idlType.fields as IdlV01DefinedFieldsTuple);
        }

        return structTypeNodeFromAnchorV01(idlType as IdlV01TypeDefTyStruct);
    }

    throw new KinobiError(KINOBI_ERROR__UNRECOGNIZED_ANCHOR_IDL_TYPE, {
        idlType: JSON.stringify(idlType),
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArrayOfSize(array: any, size: number): boolean {
    return Array.isArray(array) && array.length === size;
}
