import { CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, CodamaError } from '@codama/errors';
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
    IdlV01DefinedFields,
    IdlV01DefinedFieldsNamed,
    IdlV01DefinedFieldsTuple,
    IdlV01Field,
    IdlV01Type,
    IdlV01TypeDefTy,
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
        throw new CodamaError(CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
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
        return enumTypeNodeFromAnchorV01(idlType);
    }
    //alias
    if ('kind' in idlType && idlType.kind === 'alias' && 'value' in idlType) {
        return typeNodeFromAnchorV01(idlType.value);
    }

    // Option.
    if ('option' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType);
    }

    if ('coption' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType);
    }

    // Struct and Tuple.
    if ('kind' in idlType && idlType.kind === 'struct') {
        const fields = idlType.fields ?? [];
        if (isStructFieldArray(fields)) {
            return structTypeNodeFromAnchorV01(idlType);
        }
        if (isTupleFieldArray(fields)) {
            return tupleTypeNodeFromAnchorV01(fields);
        }
    }

    throw new CodamaError(CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
        idlType: JSON.stringify(idlType),
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArrayOfSize(array: any, size: number): boolean {
    return Array.isArray(array) && array.length === size;
}

function isStructFieldArray(field: IdlV01DefinedFields): field is IdlV01DefinedFieldsNamed {
    return field.every(isStructField);
}

function isTupleFieldArray(field: IdlV01DefinedFields): field is IdlV01DefinedFieldsTuple {
    return field.every(f => !isStructField(f));
}

function isStructField(field: IdlV01Field | IdlV01Type): field is IdlV01Field {
    return typeof field === 'object' && 'name' in field && 'type' in field;
}
