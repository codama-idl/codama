import { CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, CodamaError } from '@codama/errors';
import { titleCase } from '@codama/fragments/casing';
import { DisplaySkip, getTextNodeContent, StandaloneTypeNode, StructFieldTypeNode } from '@codama/nodes';
import { assertIsNodePath, getLastNodeFromPath, isNodePath, NodePath } from '@codama/visitors-core';

import type {
    DecodableNode,
    DecodedAccountNode,
    DecodedArrayTypeNode,
    DecodedBooleanTypeNode,
    DecodedBytesTypeNode,
    DecodedDateTimeTypeNode,
    DecodedDefinedTypeNode,
    DecodedDurationTypeNode,
    DecodedEnumTypeNode,
    DecodedEnumVariantTypeNode,
    DecodedEventNode,
    DecodedFixedPointTypeNode,
    DecodedFloatTypeNode,
    DecodedInstructionNode,
    DecodedIntegerTypeNode,
    DecodedMapTypeNode,
    DecodedNode,
    DecodedOptionTypeNode,
    DecodedPublicKeyTypeNode,
    DecodedRemainderOptionTypeNode,
    DecodedSetTypeNode,
    DecodedStringTypeNode,
    DecodedStructFieldTypeNode,
    DecodedStructTypeNode,
    DecodedTupleTypeNode,
    DecodedZeroableOptionTypeNode,
    GetDecodedNodeFromKind,
} from './decoded';
import {
    formatBoolean,
    formatBytes,
    formatDateTime,
    formatDuration,
    formatEnum,
    formatFixedPoint,
    formatFloat,
    formatInteger,
    FormatOptions,
    formatPublicKey,
    formatString,
} from './format';
import { getEnumVariantLabel } from './utils';

/** The attributes every formatted node adds to its decoded node. */
type FormattedNodeBase = {
    /**
     * Whether the formatted text cannot be trusted as is, e.g. because it contains an amount whose
     * `decimals` cannot be resolved, written as its raw value instead. Propagates to parents
     * whose text includes it.
     */
    readonly degraded: boolean;
    /**
     * The node formatted as a single line of text, e.g. `"1.5 USDC"` for an amount or
     * `"Fee: 25 bps, Owner: Alice"` for a struct, e.g. to fill a placeholder in a sentence.
     */
    readonly text: string;
};

/** A formatted account, e.g. `{ text: 'Amount: 42', data: … }`. */
export type FormattedAccountNode = FormattedNodeBase &
    Omit<DecodedAccountNode, 'data'> & {
        /** The formatted data of the account. */
        readonly data: FormattedTypeNode;
    };

/** A formatted array, e.g. `{ text: '1, 2', items: […] }`. */
export type FormattedArrayTypeNode = FormattedNodeBase &
    Omit<DecodedArrayTypeNode, 'items'> & {
        /** The formatted items of the array. */
        readonly items: readonly FormattedTypeNode[];
    };

/** A formatted boolean, e.g. `{ text: 'true' }`. */
export type FormattedBooleanTypeNode = DecodedBooleanTypeNode & FormattedNodeBase;

/** Formatted bytes, e.g. `{ text: '0x0102' }`. */
export type FormattedBytesTypeNode = DecodedBytesTypeNode & FormattedNodeBase;

/** A formatted date-time, e.g. `{ text: '2024-01-01T00:00:00Z' }`. */
export type FormattedDateTimeTypeNode = DecodedDateTimeTypeNode & FormattedNodeBase;

/** A formatted defined type, e.g. `{ text: '42', type: … }`. */
export type FormattedDefinedTypeNode = FormattedNodeBase &
    Omit<DecodedDefinedTypeNode, 'type'> & {
        /** The formatted type of the defined type. */
        readonly type: FormattedTypeNode;
    };

/** A formatted duration, e.g. `{ text: '01:30:00' }`. */
export type FormattedDurationTypeNode = DecodedDurationTypeNode & FormattedNodeBase;

/** A formatted enum, e.g. `{ text: 'Limit (Price: 100)', variant: … }`. */
export type FormattedEnumTypeNode = FormattedNodeBase &
    Omit<DecodedEnumTypeNode, 'variant'> & {
        /** The formatted variant of the enum. */
        readonly variant: FormattedEnumVariantTypeNode;
    };

/** A formatted enum variant, e.g. `{ text: 'Limit (Price: 100)', label: 'Limit', data: … }`. */
export type FormattedEnumVariantTypeNode = FormattedNodeBase &
    Omit<DecodedEnumVariantTypeNode, 'data'> & {
        /** The formatted data of the variant, absent for variants without data. */
        readonly data?: FormattedTypeNode;
        /** The label of the variant, from its display node or its identifier in title case, e.g. `"Limit"`. */
        readonly label: string;
        /** Whether the data of the variant is left out of its text, from its display node. */
        readonly skipInnerData: boolean;
    };

/** A formatted event, e.g. `{ text: 'Amount: 42', data: … }`. */
export type FormattedEventNode = FormattedNodeBase &
    Omit<DecodedEventNode, 'data'> & {
        /** The formatted data of the event. */
        readonly data: FormattedTypeNode;
    };

/** A formatted fixed point, e.g. `{ text: '123.45%' }`. */
export type FormattedFixedPointTypeNode = DecodedFixedPointTypeNode & FormattedNodeBase;

/** A formatted float, e.g. `{ text: '1.5 USD' }`. */
export type FormattedFloatTypeNode = DecodedFloatTypeNode & FormattedNodeBase;

/** A formatted instruction, e.g. `{ text: 'Amount: 42', data: … }`. */
export type FormattedInstructionNode = FormattedNodeBase &
    Omit<DecodedInstructionNode, 'data'> & {
        /** The formatted data of the instruction, absent for instructions without data. */
        readonly data?: FormattedTypeNode;
    };

/** A formatted integer, e.g. `{ text: '1.5 USDC' }`. */
export type FormattedIntegerTypeNode = DecodedIntegerTypeNode & FormattedNodeBase;

/** A formatted map, e.g. `{ text: 'Alice: 10, Bob: 5', entries: [[key, value]] }`. */
export type FormattedMapTypeNode = FormattedNodeBase &
    Omit<DecodedMapTypeNode, 'entries'> & {
        /** The formatted entries of the map. */
        readonly entries: readonly (readonly [key: FormattedTypeNode, value: FormattedTypeNode])[];
    };

/** A formatted option, e.g. `{ text: '42', item: … }` or `{ text: 'None' }`. */
export type FormattedOptionTypeNode = FormattedNodeBase &
    Omit<DecodedOptionTypeNode, 'item'> & {
        /** The formatted item of the option, absent when `None`. */
        readonly item?: FormattedTypeNode;
    };

/** A formatted public key, e.g. `{ text: 'USDC' }`. */
export type FormattedPublicKeyTypeNode = DecodedPublicKeyTypeNode & FormattedNodeBase;

/** A formatted remainder option, e.g. `{ text: '42', item: … }` or `{ text: 'None' }`. */
export type FormattedRemainderOptionTypeNode = FormattedNodeBase &
    Omit<DecodedRemainderOptionTypeNode, 'item'> & {
        /** The formatted item of the option, absent when `None`. */
        readonly item?: FormattedTypeNode;
    };

/** A formatted set, e.g. `{ text: '1, 2', items: […] }`. */
export type FormattedSetTypeNode = FormattedNodeBase &
    Omit<DecodedSetTypeNode, 'items'> & {
        /** The formatted items of the set. */
        readonly items: readonly FormattedTypeNode[];
    };

/** A formatted string, e.g. `{ text: 'hello' }`. */
export type FormattedStringTypeNode = DecodedStringTypeNode & FormattedNodeBase;

/**
 * A formatted struct field, e.g. `{ text: '1.5 USDC', label: 'Amount', type: … }`. Its text is the
 * text of its type, and its display node is inlined, with defaults.
 */
export type FormattedStructFieldTypeNode = FormattedNodeBase &
    Omit<DecodedStructFieldTypeNode, 'type'> & {
        /** Whether the fields of its struct are lifted into the parent struct. Only `true` for struct types. */
        readonly flatten: boolean;
        /** The prefix of the labels of its fields when flattened, e.g. `"config."`. Defaults to `""`. */
        readonly flattenPrefix: string;
        /** The label of the field, from its display node or its identifier in title case, e.g. `"Amount"`. */
        readonly label: string;
        /** When the field is left out of a list of fields. Fields skipped `always` are left out of the text of their struct. */
        readonly skip: DisplaySkip;
        /** The formatted type of the field. */
        readonly type: FormattedTypeNode;
    };

/** A formatted struct, e.g. `{ text: 'Fee: 25 bps, Owner: Alice', fields: […] }`. */
export type FormattedStructTypeNode = FormattedNodeBase &
    Omit<DecodedStructTypeNode, 'fields'> & {
        /** The formatted fields of the struct, in order, skipped ones included. */
        readonly fields: readonly FormattedStructFieldTypeNode[];
    };

/** A formatted tuple, e.g. `{ text: '1, a', items: […] }`. */
export type FormattedTupleTypeNode = FormattedNodeBase &
    Omit<DecodedTupleTypeNode, 'items'> & {
        /** The formatted items of the tuple. */
        readonly items: readonly FormattedTypeNode[];
    };

/** A formatted zeroable option, e.g. `{ text: '42', item: … }` or `{ text: 'None' }`. */
export type FormattedZeroableOptionTypeNode = FormattedNodeBase &
    Omit<DecodedZeroableOptionTypeNode, 'item'> & {
        /** The formatted item of the option, absent when `None`. */
        readonly item?: FormattedTypeNode;
    };

/**
 * The formatted node of each decodable node kind. Indexing it with every
 * `DecodableNode['kind']` in {@link FormattedNode} fails to type-check if a
 * kind is missing.
 */
type FormattedNodeMap = {
    accountNode: FormattedAccountNode;
    arrayTypeNode: FormattedArrayTypeNode;
    booleanTypeNode: FormattedBooleanTypeNode;
    bytesTypeNode: FormattedBytesTypeNode;
    dateTimeTypeNode: FormattedDateTimeTypeNode;
    definedTypeNode: FormattedDefinedTypeNode;
    durationTypeNode: FormattedDurationTypeNode;
    enumTypeNode: FormattedEnumTypeNode;
    enumVariantTypeNode: FormattedEnumVariantTypeNode;
    eventNode: FormattedEventNode;
    fixedPointTypeNode: FormattedFixedPointTypeNode;
    floatTypeNode: FormattedFloatTypeNode;
    instructionNode: FormattedInstructionNode;
    integerTypeNode: FormattedIntegerTypeNode;
    mapTypeNode: FormattedMapTypeNode;
    optionTypeNode: FormattedOptionTypeNode;
    publicKeyTypeNode: FormattedPublicKeyTypeNode;
    remainderOptionTypeNode: FormattedRemainderOptionTypeNode;
    setTypeNode: FormattedSetTypeNode;
    stringTypeNode: FormattedStringTypeNode;
    structFieldTypeNode: FormattedStructFieldTypeNode;
    structTypeNode: FormattedStructTypeNode;
    tupleTypeNode: FormattedTupleTypeNode;
    zeroableOptionTypeNode: FormattedZeroableOptionTypeNode;
};

/**
 * A decoded node formatted for humans: the decoded node itself, with the same children
 * formatted, plus its `text` and whether it is `degraded`. Struct fields and enum variants
 * also carry their label and display attributes.
 *
 * Every formatted node is also a valid decoded node, so it can be used wherever one is
 * expected, e.g. with {@link isDecodedNode} or {@link getDecodedNodeAtPath}.
 *
 * Without a node type, any formatted node. With one, the formatted node of that type,
 * e.g. `FormattedNode<StructTypeNode>` is a {@link FormattedStructTypeNode}.
 */
export type FormattedNode<TNode extends DecodableNode = DecodableNode> = FormattedNodeMap[TNode['kind']];

/** The formatted nodes of the given node kind(s), e.g. {@link FormattedStructTypeNode} for `'structTypeNode'`. */
export type GetFormattedNodeFromKind<TKind extends DecodableNode['kind']> = FormattedNodeMap[TKind];

/** A formatted type, e.g. the type of a struct field. */
export type FormattedTypeNode = FormattedNode<StandaloneTypeNode>;

/** The formatted node of a decoded node, e.g. {@link FormattedStructTypeNode} for a {@link DecodedStructTypeNode}. */
export type GetFormattedNodeFromDecoded<TDecoded extends DecodedNode> = {
    [TKind in DecodableNode['kind']]: TDecoded extends GetDecodedNodeFromKind<TKind>
        ? GetFormattedNodeFromKind<TKind>
        : never;
}[DecodableNode['kind']];

/**
 * Whether the formatted node was formatted from a node of the given kind(s), which narrows it
 * to the formatted node of that kind, e.g. to access its children.
 */
export function isFormattedNode<TKind extends DecodableNode['kind']>(
    formatted: FormattedNode | null | undefined,
    kind: TKind | TKind[],
): formatted is GetFormattedNodeFromKind<TKind> {
    return !!formatted && isNodePath(formatted.path, kind);
}

/**
 * Assert that the formatted node was formatted from a node of the given kind(s), which narrows
 * it to the formatted node of that kind.
 *
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` when it was not.
 */
export function assertIsFormattedNode<TKind extends DecodableNode['kind']>(
    formatted: FormattedNode | null | undefined,
    kind: TKind | TKind[],
): asserts formatted is GetFormattedNodeFromKind<TKind> {
    assertIsNodePath(formatted?.path, kind);
}

/**
 * Options of {@link formatDecodedNode}: the options of every formatter, plus overrides of the
 * formatters of leaf kinds, e.g. to write booleans as `"Yes"` or `"No"`. Overrides receive the
 * options too, so they can build on the default formatters. Public keys are formatted with
 * the `formatAddress` option.
 */
export type FormatDecodedNodeOptions = FormatOptions & {
    /** Format booleans. Defaults to {@link formatBoolean}. */
    formatBoolean?: typeof formatBoolean;
    /** Format bytes. Defaults to {@link formatBytes}. */
    formatBytes?: typeof formatBytes;
    /** Format date-times. Defaults to {@link formatDateTime}. */
    formatDateTime?: typeof formatDateTime;
    /** Format durations. Defaults to {@link formatDuration}. */
    formatDuration?: typeof formatDuration;
    /**
     * Format the label of the variant of enums. Defaults to {@link formatEnum}. It only applies when
     * formatting enums: enum variants formatted on their own, without their enum, use their
     * default label.
     */
    formatEnum?: typeof formatEnum;
    /** Format fixed points. Defaults to {@link formatFixedPoint}. */
    formatFixedPoint?: typeof formatFixedPoint;
    /** Format floats. Defaults to {@link formatFloat}. */
    formatFloat?: typeof formatFloat;
    /** Format integers, returning `null` when they cannot be formatted. Defaults to {@link formatInteger}. */
    formatInteger?: typeof formatInteger;
    /** Format strings. Defaults to {@link formatString}. */
    formatString?: typeof formatString;
};

/**
 * Format a decoded node, of any kind, into a formatted node: the same tree, where every node
 * also carries its `text` and whether it is `degraded`, and struct fields and enum variants
 * their label and display attributes. Callers walk the tree to lay it out, e.g. as rows
 * honouring `flatten` and `skip`, or use the `text` of a node to fill a sentence.
 *
 * Leaves use the formatter of their kind, which can be overridden. Containers join the text of
 * their children: struct fields as `Label: text`, items and entries with `, `, a `Some` option as
 * its item and a `None` one as `None`, and an enum as its variant's label followed by its data in
 * parentheses. Containers within containers are wrapped in parentheses, so empty ones show as `()`. Struct fields skipped
 * `always` are left out of the text, and flattened ones are replaced by their prefixed fields.
 *
 * When an integer cannot be formatted, e.g. an amount whose `decimals` cannot be resolved, its
 * text is its raw value and it is `degraded`, as is every node whose text includes it.
 *
 * @example
 * ```ts
 * const formatted = formatDecodedNode(account);
 * formatted.text; // "Amount: 1.5 USDC, Owner: Alice"
 * assertIsFormattedNode(formatted.data, 'structTypeNode');
 * formatted.data.fields.map(field => `${field.label}: ${field.text}`); // ["Amount: 1.5 USDC", "Owner: Alice"]
 * ```
 */
export function formatDecodedNode<TDecoded extends DecodedNode>(
    decoded: TDecoded,
    options: FormatDecodedNodeOptions = {},
): GetFormattedNodeFromDecoded<TDecoded> {
    return formatNode(decoded, options) as GetFormattedNodeFromDecoded<TDecoded>;
}

function formatNode(decoded: DecodedNode, options: FormatDecodedNodeOptions): FormattedNode {
    const node = getLastNodeFromPath(decoded.path as NodePath<DecodableNode>);
    const kind = node.kind;
    switch (kind) {
        case 'accountNode':
        case 'eventNode': {
            const { data } = decoded as DecodedAccountNode | DecodedEventNode;
            const formattedData = formatType(data, options);
            return { ...decoded, data: formattedData, degraded: formattedData.degraded, text: formattedData.text } as
                | FormattedAccountNode
                | FormattedEventNode;
        }
        case 'instructionNode': {
            const { data: decodedData, ...instruction } = decoded as DecodedInstructionNode;
            const data = decodedData ? formatType(decodedData, options) : undefined;
            return {
                ...instruction,
                ...(data && { data }),
                degraded: data?.degraded ?? false,
                text: data?.text ?? '',
            } satisfies FormattedInstructionNode;
        }
        case 'definedTypeNode': {
            const definedType = decoded as DecodedDefinedTypeNode;
            const type = formatType(definedType.type, options);
            return {
                ...definedType,
                degraded: type.degraded,
                text: type.text,
                type,
            } satisfies FormattedDefinedTypeNode;
        }
        case 'arrayTypeNode':
        case 'setTypeNode':
        case 'tupleTypeNode': {
            const list = decoded as DecodedArrayTypeNode | DecodedSetTypeNode | DecodedTupleTypeNode;
            const items = list.items.map(item => formatType(item, options));
            return {
                ...list,
                degraded: items.some(item => item.degraded),
                items,
                text: items.map(embed).join(', '),
            } as FormattedArrayTypeNode | FormattedSetTypeNode | FormattedTupleTypeNode;
        }
        case 'mapTypeNode': {
            const map = decoded as DecodedMapTypeNode;
            const entries = map.entries.map(
                ([key, value]) => [formatType(key, options), formatType(value, options)] as const,
            );
            return {
                ...map,
                degraded: entries.some(([key, value]) => key.degraded || value.degraded),
                entries,
                text: entries.map(([key, value]) => `${embed(key)}: ${embed(value)}`).join(', '),
            } satisfies FormattedMapTypeNode;
        }
        case 'optionTypeNode':
        case 'remainderOptionTypeNode':
        case 'zeroableOptionTypeNode': {
            const { item: decodedItem, ...option } = decoded as
                | DecodedOptionTypeNode
                | DecodedRemainderOptionTypeNode
                | DecodedZeroableOptionTypeNode;
            const item = decodedItem ? formatType(decodedItem, options) : undefined;
            return {
                ...option,
                ...(item && { item }),
                degraded: item?.degraded ?? false,
                text: item?.text ?? 'None',
            } as FormattedOptionTypeNode | FormattedRemainderOptionTypeNode | FormattedZeroableOptionTypeNode;
        }
        case 'enumTypeNode': {
            const enumNode = decoded as DecodedEnumTypeNode;
            const label = (options.formatEnum ?? formatEnum)(enumNode, options);
            const variant = formatEnumVariant(enumNode.variant, label, options);
            return {
                ...enumNode,
                degraded: variant.degraded,
                text: variant.text,
                variant,
            } satisfies FormattedEnumTypeNode;
        }
        case 'enumVariantTypeNode': {
            const variant = decoded as DecodedEnumVariantTypeNode;
            return formatEnumVariant(variant, getEnumVariantLabel(variant), options);
        }
        case 'structTypeNode': {
            const struct = decoded as DecodedStructTypeNode;
            const fields = struct.fields.map(field => formatStructField(field, options));
            const entries = getStructTextEntries(fields, '');
            return {
                ...struct,
                degraded: entries.some(([, field]) => field.degraded),
                fields,
                text: entries.map(([label, field]) => `${label}: ${embed(field.type)}`).join(', '),
            } satisfies FormattedStructTypeNode;
        }
        case 'structFieldTypeNode':
            return formatStructField(decoded as DecodedStructFieldTypeNode, options);
        case 'booleanTypeNode':
            return withText(
                decoded,
                (options.formatBoolean ?? formatBoolean)(decoded as DecodedBooleanTypeNode, options),
            );
        case 'bytesTypeNode':
            return withText(decoded, (options.formatBytes ?? formatBytes)(decoded as DecodedBytesTypeNode, options));
        case 'dateTimeTypeNode':
            return withText(
                decoded,
                (options.formatDateTime ?? formatDateTime)(decoded as DecodedDateTimeTypeNode, options),
            );
        case 'durationTypeNode':
            return withText(
                decoded,
                (options.formatDuration ?? formatDuration)(decoded as DecodedDurationTypeNode, options),
            );
        case 'fixedPointTypeNode':
            return withText(
                decoded,
                (options.formatFixedPoint ?? formatFixedPoint)(decoded as DecodedFixedPointTypeNode, options),
            );
        case 'floatTypeNode':
            return withText(decoded, (options.formatFloat ?? formatFloat)(decoded as DecodedFloatTypeNode, options));
        case 'integerTypeNode': {
            const integer = decoded as DecodedIntegerTypeNode;
            const text = (options.formatInteger ?? formatInteger)(integer, options);
            if (text === null) return { ...integer, degraded: true, text: integer.value.toString() };
            return { ...integer, degraded: false, text };
        }
        case 'publicKeyTypeNode':
            return withText(decoded, formatPublicKey(decoded as DecodedPublicKeyTypeNode, options));
        case 'stringTypeNode':
            return withText(decoded, (options.formatString ?? formatString)(decoded as DecodedStringTypeNode, options));
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, { kind: kind satisfies never });
    }
}

function formatType(decoded: DecodedNode, options: FormatDecodedNodeOptions): FormattedTypeNode {
    return formatNode(decoded, options) as FormattedTypeNode;
}

function withText(decoded: DecodedNode, text: string): FormattedNode {
    return { ...decoded, degraded: false, text } as FormattedNode;
}

function formatEnumVariant(
    variant: DecodedEnumVariantTypeNode,
    label: string,
    options: FormatDecodedNodeOptions,
): FormattedEnumVariantTypeNode {
    const { data: decodedData, ...rest } = variant;
    const skipInnerData = getLastNodeFromPath(variant.path).display?.skipInnerData ?? false;
    const data = decodedData ? formatType(decodedData, options) : undefined;
    const shownData = !skipInnerData && data && data.text !== '' ? data : undefined;
    return {
        ...rest,
        ...(data && { data }),
        degraded: shownData?.degraded ?? false,
        label,
        skipInnerData,
        text: shownData ? `${label} (${shownData.text})` : label,
    };
}

function formatStructField(
    decoded: DecodedStructFieldTypeNode,
    options: FormatDecodedNodeOptions,
): FormattedStructFieldTypeNode {
    const field: StructFieldTypeNode = getLastNodeFromPath(decoded.path);
    const display = field.display;
    const type = formatType(decoded.type, options);
    return {
        ...decoded,
        degraded: type.degraded,
        flatten: (display?.flatten ?? false) && isFormattedNode(type, 'structTypeNode'),
        flattenPrefix: display?.flattenPrefix === undefined ? '' : getTextNodeContent(display.flattenPrefix),
        label: display?.label === undefined ? titleCase(field.identifier) : getTextNodeContent(display.label),
        skip: display?.skip ?? 'never',
        text: type.text,
        type,
    };
}

/**
 * The labelled fields a struct shows in its text: fields skipped `always` are left out and
 * flattened fields are replaced by their own fields, labelled with their prefix.
 */
function getStructTextEntries(
    fields: readonly FormattedStructFieldTypeNode[],
    prefix: string,
): (readonly [label: string, field: FormattedStructFieldTypeNode])[] {
    return fields.flatMap(field => {
        if (field.skip === 'always') return [];
        if (field.flatten && isFormattedNode(field.type, 'structTypeNode')) {
            return getStructTextEntries(field.type.fields, prefix + field.flattenPrefix);
        }
        return [[prefix + field.label, field] as const];
    });
}

/** The text of a node within the text of a container, wrapped in parentheses when it is a container itself. */
function embed(formatted: FormattedTypeNode): string {
    return isComposite(formatted) ? `(${formatted.text})` : formatted.text;
}

function isComposite(formatted: FormattedTypeNode): boolean {
    if (isFormattedNode(formatted, ['optionTypeNode', 'remainderOptionTypeNode', 'zeroableOptionTypeNode'])) {
        return !!formatted.item && isComposite(formatted.item);
    }
    return isFormattedNode(formatted, [
        'arrayTypeNode',
        'mapTypeNode',
        'setTypeNode',
        'structTypeNode',
        'tupleTypeNode',
    ]);
}
