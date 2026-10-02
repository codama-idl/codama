import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { linkNodeFromV1 } from './linkNodes';
import {
    getLastV1NodeFromPath,
    getV1LinkedDefinedTypePath,
    resolveV1TypePath,
    unwrapV1TypeNode,
    V1NodePath,
} from './paths';
import { compactAndFreeze, decimalStringFromV1, integerStringFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';

/**
 * Convert a v1 value node, given the path of the v1 type it is a value of, if
 * known. The two paths differ when the type is reached through links, e.g.
 * a field value of a struct defined elsewhere.
 *
 * The type tells v1 numbers apart: they become integer values, or float
 * values for float types and non-integral numbers. Without a type, integral
 * numbers become integers.
 */
export function valueNodeFromV1(
    valuePath: V1NodePath<v1.ValueNode>,
    typePath: V1NodePath<v1.TypeNode> | undefined,
): v2.ValueNode {
    const value = getLastV1NodeFromPath(valuePath);
    const resolvedPath = resolveV1TypePath(typePath);
    const type = resolvedPath ? getLastV1NodeFromPath(resolvedPath) : undefined;
    /** The path of a type nested in the resolved type, e.g. the item of an array. */
    const nested = (child: v1.TypeNode | undefined): V1NodePath<v1.TypeNode> | undefined =>
        resolvedPath && child ? [...resolvedPath, child] : undefined;

    switch (value.kind) {
        case 'arrayValueNode':
        case 'setValueNode': {
            const itemType = type?.kind === 'arrayTypeNode' || type?.kind === 'setTypeNode' ? type.item : undefined;
            return compactAndFreeze({
                items: value.items?.map(item => valueNodeFromV1([...valuePath, item], nested(itemType))),
                kind: value.kind,
            });
        }
        case 'booleanValueNode':
            return compactAndFreeze({ boolean: value.boolean, kind: 'booleanValueNode' });
        case 'bytesValueNode':
            return compactAndFreeze({ data: value.data, encoding: value.encoding, kind: 'bytesValueNode' });
        case 'constantValueNode':
            return constantValueNodeFromV1(valuePath as V1NodePath<v1.ConstantValueNode>);
        case 'enumValueNode':
            return enumValueNodeFromV1(valuePath as V1NodePath<v1.EnumValueNode>);
        case 'injectedValueNode':
            return compactAndFreeze({
                fallback: value.fallback ? valueNodeFromV1([...valuePath, value.fallback], typePath) : undefined,
                key: value.key as string as v2.IdentifierString,
                kind: 'injectedValueNode',
            });
        case 'mapValueNode': {
            const mapType = type?.kind === 'mapTypeNode' ? type : undefined;
            return compactAndFreeze({
                entries: value.entries?.map(entry =>
                    compactAndFreeze({
                        key: valueNodeFromV1([...valuePath, entry, entry.key], nested(mapType?.key)),
                        kind: 'mapEntryValueNode',
                        value: valueNodeFromV1([...valuePath, entry, entry.value], nested(mapType?.value)),
                    }),
                ),
                kind: 'mapValueNode',
            });
        }
        case 'noneValueNode':
            return compactAndFreeze({ kind: 'noneValueNode' });
        case 'numberValueNode':
            return numberValueNodeFromV1(value, type);
        case 'publicKeyValueNode':
            return compactAndFreeze({
                identifier: value.identifier ? (value.identifier as string as v2.IdentifierString) : undefined,
                kind: 'publicKeyValueNode',
                publicKey: value.publicKey,
            });
        case 'someValueNode': {
            const itemType =
                type?.kind === 'optionTypeNode' ||
                type?.kind === 'remainderOptionTypeNode' ||
                type?.kind === 'zeroableOptionTypeNode'
                    ? type.item
                    : undefined;
            return compactAndFreeze({
                kind: 'someValueNode',
                value: valueNodeFromV1([...valuePath, value.value], nested(itemType)),
            });
        }
        case 'stringValueNode':
            return compactAndFreeze({ kind: 'stringValueNode', string: value.string });
        case 'structValueNode': {
            const fields = type?.kind === 'structTypeNode' ? type.fields : undefined;
            return compactAndFreeze({
                fields: value.fields?.map((field): v2.StructFieldValueNode => {
                    const fieldType = fields?.find(candidate => candidate.name === field.name);
                    return compactAndFreeze({
                        identifier: field.name as string as v2.IdentifierString,
                        kind: 'structFieldValueNode',
                        value: valueNodeFromV1(
                            [...valuePath, field, field.value],
                            resolvedPath && fieldType ? [...resolvedPath, fieldType, fieldType.type] : undefined,
                        ),
                    });
                }),
                kind: 'structValueNode',
            });
        }
        case 'tupleValueNode': {
            const items = type?.kind === 'tupleTypeNode' ? type.items : undefined;
            return compactAndFreeze({
                items: value.items?.map((item, index) => valueNodeFromV1([...valuePath, item], nested(items?.[index]))),
                kind: 'tupleValueNode',
            });
        }
    }
}

/** Convert a v1 constant value, typed by its own type. */
export function constantValueNodeFromV1(path: V1NodePath<v1.ConstantValueNode>): v2.ConstantValueNode {
    const value = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        kind: 'constantValueNode',
        type: typeNodeFromV1([...path, value.type]),
        value: valueNodeFromV1([...path, value.value], [...path, value.type]),
    });
}

function numberValueNodeFromV1(value: v1.NumberValueNode, type: v1.TypeNode | undefined): v2.ValueNode {
    const number = getV1NumberType(type);
    const isFloat = number?.format === 'f32' || number?.format === 'f64';
    if (isFloat || !Number.isInteger(value.number)) {
        return compactAndFreeze({ kind: 'floatValueNode', value: decimalStringFromV1(value.number) });
    }
    return compactAndFreeze({ kind: 'integerValueNode', value: integerStringFromV1(value.number) });
}

/** The number of a v1 type describing numbers, e.g. the number of an `amountTypeNode`. */
function getV1NumberType(type: v1.TypeNode | undefined): v1.NumberTypeNode | undefined {
    switch (type?.kind) {
        case 'numberTypeNode':
            return type;
        case 'amountTypeNode':
        case 'dateTimeTypeNode':
        case 'solAmountTypeNode':
            return unwrapV1TypeNode<v1.NumberTypeNode>(type.number).type;
        default:
            return undefined;
    }
}

/**
 * Convert a v1 enum value, whose payload is typed by the data of its variant.
 * The enum is found by following the link of the value from the path of that
 * value, as v1 links without a `program` point into their own program.
 */
function enumValueNodeFromV1(path: V1NodePath<v1.EnumValueNode>): v2.ValueNode {
    const value = getLastV1NodeFromPath(path);
    const definedTypePath = getV1LinkedDefinedTypePath([...path, value.enum]);
    const definedType = definedTypePath ? getLastV1NodeFromPath(definedTypePath) : undefined;
    const enumPath =
        definedTypePath && definedType ? resolveV1TypePath([...definedTypePath, definedType.type]) : undefined;
    const enumType = enumPath ? getLastV1NodeFromPath(enumPath) : undefined;
    const variant =
        enumType?.kind === 'enumTypeNode'
            ? enumType.variants?.find(candidate => candidate.name === value.variant)
            : undefined;
    const dataType = getV1VariantDataType(variant);

    return compactAndFreeze({
        enum: linkNodeFromV1(value.enum),
        kind: 'enumValueNode',
        value: value.value
            ? valueNodeFromV1(
                  [...path, value.value],
                  enumPath && variant && dataType ? [...enumPath, variant, dataType] : undefined,
              )
            : undefined,
        variant: value.variant as string as v2.IdentifierString,
    });
}

function getV1VariantDataType(variant: v1.EnumVariantTypeNode | undefined): v1.TypeNode | undefined {
    switch (variant?.kind) {
        case 'enumStructVariantTypeNode':
            return variant.struct;
        case 'enumTupleVariantTypeNode':
            return variant.tuple;
        default:
            return undefined;
    }
}
