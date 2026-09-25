import {
    CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE,
    CodamaError,
} from '@codama/errors';
import {
    booleanTypeNode,
    definedTypeLinkNode,
    floatTypeNode,
    integerTypeNode,
    publicKeyTypeNode,
    TypeNode,
} from '@codama/nodes';

import { borshSizePrefixedTypeNode } from '../../utils';
import type {
    IdlV01DefinedFields,
    IdlV01DefinedFieldsNamed,
    IdlV01DefinedFieldsTuple,
    IdlV01Field,
    IdlV01Type,
    IdlV01TypeDefTy,
} from '../idl';
import { type GenericsV01, unwrapGenericTypeFromAnchorV01 } from '../unwrapGenerics';
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

export const typeNodeFromAnchorV01 = (idlType: IdlV01Type | IdlV01TypeDefTy, generics: GenericsV01): TypeNode => {
    // Leaf.
    if (typeof idlType === 'string' && IDL_V01_TYPE_LEAVES.includes(idlType)) {
        if (idlType === 'bool') return booleanTypeNode();
        if (idlType === 'pubkey') return publicKeyTypeNode();
        if (idlType === 'string' || idlType === 'bytes') return borshSizePrefixedTypeNode(idlType);
        if (idlType === 'f32' || idlType === 'f64') return floatTypeNode(idlType);
        return integerTypeNode(idlType);
    }

    // Ensure eveything else is an object.
    if (typeof idlType !== 'object') {
        throw new CodamaError(CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
            idlType: JSON.stringify(idlType),
        });
    }

    // Array.
    if ('array' in idlType && isArrayOfSize(idlType.array, 2)) {
        return arrayTypeNodeFromAnchorV01(idlType, generics);
    }

    // Vec.
    if ('vec' in idlType) {
        return arrayTypeNodeFromAnchorV01(idlType, generics);
    }

    // Defined link.
    if ('defined' in idlType && typeof idlType.defined === 'object') {
        return 'generics' in idlType.defined
            ? unwrapGenericTypeFromAnchorV01(idlType, generics)
            : definedTypeLinkNode(idlType.defined.name);
    }

    // Generic reference.
    if ('generic' in idlType) {
        const typeArg = generics.typeArgs[idlType.generic];
        if (!typeArg) {
            throw new CodamaError(CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING, { name: idlType.generic });
        }
        return typeNodeFromAnchorV01(typeArg.type, generics);
    }

    // Enum.
    if ('kind' in idlType && idlType.kind === 'enum' && 'variants' in idlType) {
        return enumTypeNodeFromAnchorV01(idlType, generics);
    }

    // Alias.
    if ('kind' in idlType && idlType.kind === 'alias' && 'value' in idlType) {
        return typeNodeFromAnchorV01(idlType.value, generics);
    }

    // Option.
    if ('option' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType, generics);
    }

    if ('coption' in idlType) {
        return optionTypeNodeFromAnchorV01(idlType, generics);
    }

    // Struct and Tuple.
    if ('kind' in idlType && idlType.kind === 'struct') {
        const fields = idlType.fields ?? [];
        if (isStructFieldArray(fields)) {
            return structTypeNodeFromAnchorV01(idlType, generics);
        }
        if (isTupleFieldArray(fields)) {
            return tupleTypeNodeFromAnchorV01(fields, generics);
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
