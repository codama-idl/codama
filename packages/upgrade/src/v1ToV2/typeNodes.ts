import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';

import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { displayNodeFromV1, injectableIntegerValueNodeFromV1, injectableStringValueNodeFromV1 } from './displayNodes';
import { linkNodeFromV1 } from './linkNodes';
import { getLastV1NodeFromPath, unwrapV1TypePath, V1NodePath, V1WrapperTypeNode } from './paths';
import { compactAndFreeze, docsFromV1, integerStringFromV1 } from './shared';
import { constantValueNodeFromV1, valueNodeFromV1 } from './valueNodes';

/** Convert a v1 type node, turning wrappers into transforms and splitting numbers by kind. */
export function typeNodeFromV1(path: V1NodePath<v1.TypeNode>): v2.TypeNode {
    const unwrapped = unwrapV1TypePath<Exclude<v1.TypeNode, V1WrapperTypeNode>>(path);
    return withTransforms(standaloneTypeNodeFromV1(unwrapped.path), transformsFromV1(unwrapped.wrappers));
}

/**
 * Convert a v1 number in a position that only accepts integers, e.g. a size
 * prefix. Displays turning numbers into date-times or durations are dropped,
 * since these positions only accept integers.
 *
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` for float formats.
 */
export function integerTypeNodeFromV1(path: V1NodePath<v1.NestedTypeNode<v1.NumberTypeNode>>): v2.IntegerTypeNode {
    const unwrapped = unwrapV1TypePath<v1.NumberTypeNode>(path);
    const converted = numberTypeNodeFromV1(unwrapped.path, { allowTimes: false });
    if (converted.kind !== 'integerTypeNode') {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['integerTypeNode'],
            kind: converted.kind,
            node: converted,
        });
    }
    return withTransforms(converted, transformsFromV1(unwrapped.wrappers));
}

export function structTypeNodeFromV1(path: V1NodePath<v1.StructTypeNode>): v2.StructTypeNode {
    const type = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        fields: type.fields?.map(field => structFieldTypeNodeFromV1([...path, field])),
        kind: 'structTypeNode',
    });
}

export function structFieldTypeNodeFromV1(path: V1NodePath<v1.StructFieldTypeNode>): v2.StructFieldTypeNode {
    const field = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        defaultValue: field.defaultValue
            ? valueNodeFromV1([...path, field.defaultValue], [...path, field.type])
            : undefined,
        defaultValueStrategy: field.defaultValueStrategy,
        display: field.display ? displayNodeFromV1(field.display) : undefined,
        docs: docsFromV1(field.docs),
        identifier: field.name as string as v2.IdentifierString,
        kind: 'structFieldTypeNode',
        type: typeNodeFromV1([...path, field.type]),
    });
}

/**
 * Convert a v1 enum variant. Tuple variants keep their tuple, even with a single
 * item, so the upgraded variant has the same shape as in v1.
 */
export function enumVariantTypeNodeFromV1(path: V1NodePath<v1.EnumVariantTypeNode>): v2.EnumVariantTypeNode {
    const variant = getLastV1NodeFromPath(path);
    return compactAndFreeze({
        data: enumVariantDataFromV1(path),
        discriminator: variant.discriminator,
        display: variant.display ? displayNodeFromV1(variant.display) : undefined,
        identifier: variant.name as string as v2.IdentifierString,
        kind: 'enumVariantTypeNode',
    });
}

function enumVariantDataFromV1(path: V1NodePath<v1.EnumVariantTypeNode>): v2.TypeNode | undefined {
    const variant = getLastV1NodeFromPath(path);
    switch (variant.kind) {
        case 'enumEmptyVariantTypeNode':
            return undefined;
        case 'enumStructVariantTypeNode':
            return typeNodeFromV1([...path, variant.struct]);
        case 'enumTupleVariantTypeNode':
            return typeNodeFromV1([...path, variant.tuple]);
    }
}

function standaloneTypeNodeFromV1(path: V1NodePath<Exclude<v1.TypeNode, V1WrapperTypeNode>>): v2.TypeNode {
    const type = getLastV1NodeFromPath(path);
    switch (type.kind) {
        case 'amountTypeNode':
            return quantityTypeNodeFromV1([...path, type.number], type.decimals, type.unit);
        case 'arrayTypeNode':
            return compactAndFreeze({
                count: countNodeFromV1([...path, type.count]),
                item: typeNodeFromV1([...path, type.item]),
                kind: 'arrayTypeNode',
            });
        case 'booleanTypeNode':
            return compactAndFreeze({ kind: 'booleanTypeNode', size: integerTypeNodeFromV1([...path, type.size]) });
        case 'bytesTypeNode':
            return compactAndFreeze({ kind: 'bytesTypeNode' });
        case 'dateTimeTypeNode':
            return dateTimeTypeNodeFromV1([...path, type.number]);
        case 'definedTypeLinkNode':
            return linkNodeFromV1(type);
        case 'enumTypeNode':
            return compactAndFreeze<v2.EnumTypeNode>({
                kind: 'enumTypeNode',
                size: integerTypeNodeFromV1([...path, type.size]),
                variants: type.variants?.map(variant => enumVariantTypeNodeFromV1([...path, variant])),
            });
        case 'mapTypeNode':
            return compactAndFreeze({
                count: countNodeFromV1([...path, type.count]),
                key: typeNodeFromV1([...path, type.key]),
                kind: 'mapTypeNode',
                value: typeNodeFromV1([...path, type.value]),
            });
        case 'numberTypeNode':
            return numberTypeNodeFromV1(path as V1NodePath<v1.NumberTypeNode>, { allowTimes: true });
        case 'optionTypeNode':
            return compactAndFreeze({
                fixed: type.fixed,
                item: typeNodeFromV1([...path, type.item]),
                kind: 'optionTypeNode',
                prefix: integerTypeNodeFromV1([...path, type.prefix]),
            });
        case 'publicKeyTypeNode':
            return compactAndFreeze({ kind: 'publicKeyTypeNode' });
        case 'remainderOptionTypeNode':
            return compactAndFreeze({ item: typeNodeFromV1([...path, type.item]), kind: 'remainderOptionTypeNode' });
        case 'setTypeNode':
            return compactAndFreeze({
                count: countNodeFromV1([...path, type.count]),
                item: typeNodeFromV1([...path, type.item]),
                kind: 'setTypeNode',
            });
        case 'solAmountTypeNode':
            return quantityTypeNodeFromV1([...path, type.number], 9, 'SOL');
        case 'stringTypeNode':
            return compactAndFreeze({
                display: type.display ? displayNodeFromV1(type.display) : undefined,
                encoding: type.encoding,
                kind: 'stringTypeNode',
            });
        case 'structTypeNode':
            return structTypeNodeFromV1(path as V1NodePath<v1.StructTypeNode>);
        case 'tupleTypeNode':
            return compactAndFreeze({
                items: type.items?.map(item => typeNodeFromV1([...path, item])),
                kind: 'tupleTypeNode',
            });
        case 'zeroableOptionTypeNode':
            return compactAndFreeze({
                item: typeNodeFromV1([...path, type.item]),
                kind: 'zeroableOptionTypeNode',
                zeroValue: type.zeroValue ? constantValueNodeFromV1([...path, type.zeroValue]) : undefined,
            });
    }
}

/**
 * Convert a v1 number. Integers and floats become distinct nodes, and
 * date-time and duration displays become `dateTimeTypeNode` and
 * `durationTypeNode` wrappers, when allowed, since they now describe value
 * semantics rather than presentation.
 */
function numberTypeNodeFromV1(
    path: V1NodePath<v1.NumberTypeNode>,
    options: { allowTimes: boolean },
): v2.DateTimeTypeNode | v2.DurationTypeNode | v2.FloatTypeNode | v2.IntegerTypeNode {
    const number = getLastV1NodeFromPath(path);
    const display = number.display;
    if (number.format === 'f32' || number.format === 'f64') {
        // Floats only accept unit displays, and cannot be date-times nor durations.
        const unitDisplay =
            display?.kind === 'amountNumberDisplayNode' ? unitDisplayNodeFromV1([...path, display]) : undefined;
        return compactAndFreeze({
            display: unitDisplay,
            endian: number.endian,
            format: number.format,
            kind: 'floatTypeNode',
        });
    }

    const integer = compactAndFreeze<v2.IntegerTypeNode>({
        display: display?.kind === 'amountNumberDisplayNode' ? numberDisplayNodeFromV1([...path, display]) : undefined,
        endian: number.endian,
        format: number.format,
        kind: 'integerTypeNode',
    });
    if (options.allowTimes && display?.kind === 'dateTimeNumberDisplayNode') {
        return compactAndFreeze({ kind: 'dateTimeTypeNode', number: integer, ticksPerSecond: display.ticksPerSecond });
    }
    if (options.allowTimes && display?.kind === 'durationNumberDisplayNode') {
        return compactAndFreeze({ kind: 'durationTypeNode', number: integer, ticksPerSecond: display.ticksPerSecond });
    }
    return integer;
}

/**
 * v1 amount displays without decimals cannot scale their number, so they
 * become unit displays, or are dropped without a unit.
 */
function numberDisplayNodeFromV1(path: V1NodePath<v1.AmountNumberDisplayNode>): v2.NumberDisplayNode | undefined {
    const display = getLastV1NodeFromPath(path);
    if (display.decimals === undefined) return unitDisplayNodeFromV1(path);
    return compactAndFreeze<v2.AmountNumberDisplayNode>({
        decimals: injectableIntegerValueNodeFromV1([...path, display.decimals]),
        kind: 'amountNumberDisplayNode',
        unit: display.unit ? injectableStringValueNodeFromV1([...path, display.unit]) : undefined,
    });
}

function unitDisplayNodeFromV1(path: V1NodePath<v1.AmountNumberDisplayNode>): v2.UnitNumberDisplayNode | undefined {
    const display = getLastV1NodeFromPath(path);
    if (!display.unit) return undefined;
    return compactAndFreeze<v2.UnitNumberDisplayNode>({
        kind: 'unitNumberDisplayNode',
        unit: injectableStringValueNodeFromV1([...path, display.unit]),
    });
}

/**
 * Convert the number of a v1 quantity, e.g. an `amountTypeNode`, into a fixed
 * point of the given scale or, without decimals, an integer with a unit.
 *
 * Fixed points only accept fixed-size integers, so `shortU16` amounts are
 * upgraded to integers with an amount display of the same decimals, and float
 * amounts to floats with the unit only, since floats cannot be scaled.
 */
function quantityTypeNodeFromV1(
    path: V1NodePath<v1.NestedTypeNode<v1.NumberTypeNode>>,
    decimals: number,
    unit: string | undefined,
): v2.TypeNode {
    const unwrapped = unwrapV1TypePath<v1.NumberTypeNode>(path);
    const number = getLastV1NodeFromPath(unwrapped.path);
    const transforms = transformsFromV1(unwrapped.wrappers);

    if (number.format === 'f32' || number.format === 'f64') {
        return compactAndFreeze<v2.FloatTypeNode>({
            endian: number.endian,
            format: number.format,
            kind: 'floatTypeNode',
            transforms,
            unit,
        });
    }

    // The integer is a pure encoding slot of the quantity, so its own displays are dropped.
    const integer = compactAndFreeze<v2.IntegerTypeNode>({
        endian: number.endian,
        format: number.format,
        kind: 'integerTypeNode',
    });
    if (decimals === 0) return compactAndFreeze({ ...integer, transforms, unit });
    if (number.format === 'shortU16') {
        return compactAndFreeze<v2.IntegerTypeNode>({
            ...integer,
            display: compactAndFreeze<v2.AmountNumberDisplayNode>({
                decimals: compactAndFreeze<v2.IntegerValueNode>({
                    kind: 'integerValueNode',
                    value: integerStringFromV1(decimals),
                }),
                kind: 'amountNumberDisplayNode',
                unit: unit
                    ? compactAndFreeze<v2.StringValueNode>({ kind: 'stringValueNode', string: unit })
                    : undefined,
            }),
            transforms,
        });
    }
    return compactAndFreeze<v2.FixedPointTypeNode>({
        kind: 'fixedPointTypeNode',
        number: integer,
        scale: decimals,
        transforms,
        unit,
    });
}

/**
 * Convert the number of a v1 date-time, merging the `ticksPerSecond` of its
 * date-time display, if any. The date-time type wins over the displays of its
 * number: amount displays are dropped, since the number of a v2 date-time is a
 * pure encoding slot, and so are duration displays, which contradict the
 * date-time. Float date-times become floats, since v2 date-times only wrap
 * integers.
 */
function dateTimeTypeNodeFromV1(path: V1NodePath<v1.NestedTypeNode<v1.NumberTypeNode>>): v2.TypeNode {
    const unwrapped = unwrapV1TypePath<v1.NumberTypeNode>(path);
    const transforms = transformsFromV1(unwrapped.wrappers);
    const converted = numberTypeNodeFromV1(unwrapped.path, { allowTimes: true });
    switch (converted.kind) {
        case 'dateTimeTypeNode':
            return withTransforms(converted, transforms);
        case 'durationTypeNode':
        case 'integerTypeNode': {
            const integer = converted.kind === 'durationTypeNode' ? converted.number : converted;
            return compactAndFreeze<v2.DateTimeTypeNode>({
                kind: 'dateTimeTypeNode',
                number: compactAndFreeze({ ...integer, display: undefined }),
                transforms,
            });
        }
        case 'floatTypeNode':
            return withTransforms(converted, transforms);
    }
}

export function countNodeFromV1(path: V1NodePath<v1.CountNode>): v2.CountNode {
    const count = getLastV1NodeFromPath(path);
    switch (count.kind) {
        case 'fixedCountNode':
            return compactAndFreeze({ kind: 'fixedCountNode', value: count.value });
        case 'prefixedCountNode':
            return compactAndFreeze({
                kind: 'prefixedCountNode',
                prefix: integerTypeNodeFromV1([...path, count.prefix]),
            });
        case 'remainderCountNode':
            return compactAndFreeze({ kind: 'remainderCountNode' });
    }
}

/** The v2 transforms of v1 wrappers given outermost first, i.e. innermost first. */
function transformsFromV1(wrapperPaths: readonly V1NodePath<V1WrapperTypeNode>[]): v2.TransformNode[] {
    return wrapperPaths.map(transformNodeFromV1).reverse();
}

function transformNodeFromV1(path: V1NodePath<V1WrapperTypeNode>): v2.TransformNode {
    const wrapper = getLastV1NodeFromPath(path);
    switch (wrapper.kind) {
        case 'fixedSizeTypeNode':
            return compactAndFreeze({ kind: 'fixedSizeTransformNode', size: wrapper.size });
        case 'hiddenPrefixTypeNode':
            return compactAndFreeze({
                kind: 'hiddenPrefixTransformNode',
                prefix: wrapper.prefix?.map(constant => constantValueNodeFromV1([...path, constant])),
            });
        case 'hiddenSuffixTypeNode':
            return compactAndFreeze({
                kind: 'hiddenSuffixTransformNode',
                suffix: wrapper.suffix?.map(constant => constantValueNodeFromV1([...path, constant])),
            });
        case 'postOffsetTypeNode':
            return compactAndFreeze({
                kind: 'postOffsetTransformNode',
                offset: wrapper.offset,
                strategy: wrapper.strategy,
            });
        case 'preOffsetTypeNode':
            return compactAndFreeze({
                kind: 'preOffsetTransformNode',
                offset: wrapper.offset,
                strategy: wrapper.strategy,
            });
        case 'sentinelTypeNode':
            return compactAndFreeze({
                kind: 'sentinelTransformNode',
                sentinel: constantValueNodeFromV1([...path, wrapper.sentinel]),
            });
        case 'sizePrefixTypeNode':
            return compactAndFreeze({
                kind: 'sizePrefixTransformNode',
                prefix: integerTypeNodeFromV1([...path, wrapper.prefix]),
            });
    }
}

/** Append transforms after the existing ones of a type, which are applied first. */
function withTransforms<T extends v2.TypeNode>(type: T, transforms: readonly v2.TransformNode[]): T {
    if (transforms.length === 0) return type;
    return compactAndFreeze({ ...type, transforms: [...(type.transforms ?? []), ...transforms] });
}
