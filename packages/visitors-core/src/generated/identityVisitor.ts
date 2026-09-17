import {
    accountBumpValueNode,
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    accountValueNode,
    amountNumberDisplayNode,
    arrayTypeNode,
    arrayValueNode,
    assertIsNode,
    booleanTypeNode,
    booleanValueNode,
    bytesTypeNode,
    bytesValueNode,
    conditionalValueNode,
    constantDiscriminatorNode,
    constantNode,
    constantPdaSeedNode,
    constantValueNode,
    COUNT_NODES,
    dataValueNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    DISCRIMINATOR_NODES,
    durationTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantDisplayNode,
    enumVariantTypeNode,
    errorNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedCountNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    floatValueNode,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    identityValueNode,
    injectedValueNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    instructionAccountDisplayNode,
    instructionAccountLinkNode,
    instructionAccountNode,
    instructionByteDeltaNode,
    instructionDisplayNode,
    instructionLinkNode,
    instructionNode,
    instructionRemainingAccountsNode,
    instructionStatusNode,
    integerTypeNode,
    integerValueNode,
    mapEntryValueNode,
    mapTypeNode,
    mapValueNode,
    noneValueNode,
    optionTypeNode,
    payerValueNode,
    PDA_SEED_NODES,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    pluginNode,
    postOffsetTransformNode,
    prefixedCountNode,
    preOffsetTransformNode,
    programIdValueNode,
    programLinkNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    REGISTERED_NODE_KINDS,
    remainderCountNode,
    remainderOptionTypeNode,
    removeNullAndAssertIsNodeFilter,
    rootNode,
    sentinelCountNode,
    sentinelTransformNode,
    setTypeNode,
    setValueNode,
    sizeDiscriminatorNode,
    sizePrefixTransformNode,
    someValueNode,
    stringDisplayNode,
    stringTypeNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    textNode,
    TRANSFORM_NODE_KINDS,
    tupleTypeNode,
    tupleValueNode,
    type Node,
    type NodeKind,
    TYPE_NODES,
    unitNumberDisplayNode,
    VALUE_NODES,
    variablePdaSeedNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';

import { staticVisitor } from '../staticVisitor';
import { type Visitor, visit as baseVisit } from '../visitor';

/**
 * Identity visitor: rebuilds the tree node-by-node so callers can
 * intercept individual nodes via override hooks while leaving the
 * rest untouched. Returns `null` to drop a node (and its parents
 * that required it).
 */
export function identityVisitor<TNodeKind extends NodeKind = NodeKind>(
    options: { keys?: TNodeKind[] } = {},
): Visitor<Node | null, TNodeKind> {
    const keys: NodeKind[] = options.keys ?? (REGISTERED_NODE_KINDS as TNodeKind[]);
    const visitor = staticVisitor(node => Object.freeze({ ...node }), { keys }) as Visitor<Node | null>;
    const visit =
        (v: Visitor<Node | null>) =>
        (node: Node): Node | null =>
            keys.includes(node.kind) ? baseVisit(node, v) : Object.freeze({ ...node });

    if (keys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            const count = visit(this)(node.count);
            if (count === null) return null;
            assertIsNode(count, COUNT_NODES);
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return arrayTypeNode(item, count, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            const size = visit(this)(node.size);
            if (size === null) return null;
            assertIsNode(size, 'integerTypeNode');
            return booleanTypeNode({
                ...node,
                size,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('bytesTypeNode')) {
        visitor.visitBytesType = function visitBytesType(node) {
            return bytesTypeNode({
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNode(number, 'integerTypeNode');
            return dateTimeTypeNode(number, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('durationTypeNode')) {
        visitor.visitDurationType = function visitDurationType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNode(number, 'integerTypeNode');
            return durationTypeNode(number, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            const size = visit(this)(node.size);
            if (size === null) return null;
            assertIsNode(size, 'integerTypeNode');
            return enumTypeNode(
                (node.variants ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('enumVariantTypeNode')),
                {
                    ...node,
                    size,
                    transforms: node.transforms
                        ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                        : undefined,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('enumVariantTypeNode')) {
        visitor.visitEnumVariantType = function visitEnumVariantType(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const data = node.data ? (visit(this)(node.data) ?? undefined) : undefined;
            if (data) assertIsNode(data, TYPE_NODES);
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'enumVariantDisplayNode');
            return enumVariantTypeNode(node.identifier, {
                ...node,
                docs,
                data,
                display,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('fixedPointTypeNode')) {
        visitor.visitFixedPointType = function visitFixedPointType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNode(number, 'integerTypeNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'unitNumberDisplayNode');
            return fixedPointTypeNode(number, node.scale, {
                ...node,
                display,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('floatTypeNode')) {
        visitor.visitFloatType = function visitFloatType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'unitNumberDisplayNode');
            return floatTypeNode(node.format, {
                ...node,
                display,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('integerTypeNode')) {
        visitor.visitIntegerType = function visitIntegerType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, ['amountNumberDisplayNode', 'unitNumberDisplayNode']);
            return integerTypeNode(node.format, {
                ...node,
                display,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('mapTypeNode')) {
        visitor.visitMapType = function visitMapType(node) {
            const count = visit(this)(node.count);
            if (count === null) return null;
            assertIsNode(count, COUNT_NODES);
            const key = visit(this)(node.key);
            if (key === null) return null;
            assertIsNode(key, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, TYPE_NODES);
            return mapTypeNode(key, value, count, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('optionTypeNode')) {
        visitor.visitOptionType = function visitOptionType(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNode(prefix, 'integerTypeNode');
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return optionTypeNode(item, {
                ...node,
                prefix,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('publicKeyTypeNode')) {
        visitor.visitPublicKeyType = function visitPublicKeyType(node) {
            return publicKeyTypeNode({
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('remainderOptionTypeNode')) {
        visitor.visitRemainderOptionType = function visitRemainderOptionType(node) {
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return remainderOptionTypeNode(item, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('setTypeNode')) {
        visitor.visitSetType = function visitSetType(node) {
            const count = visit(this)(node.count);
            if (count === null) return null;
            assertIsNode(count, COUNT_NODES);
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return setTypeNode(item, count, {
                ...node,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('stringTypeNode')) {
        visitor.visitStringType = function visitStringType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'stringDisplayNode');
            return stringTypeNode(node.encoding, {
                ...node,
                display,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const defaultValue = node.defaultValue ? (visit(this)(node.defaultValue) ?? undefined) : undefined;
            if (defaultValue) assertIsNode(defaultValue, VALUE_NODES);
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'structFieldDisplayNode');
            return structFieldTypeNode({
                ...node,
                docs,
                type,
                defaultValue,
                display,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            return structTypeNode(
                (node.fields ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldTypeNode')),
                {
                    ...node,
                    transforms: node.transforms
                        ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                        : undefined,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            return tupleTypeNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TYPE_NODES)),
                {
                    ...node,
                    transforms: node.transforms
                        ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                        : undefined,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('zeroableOptionTypeNode')) {
        visitor.visitZeroableOptionType = function visitZeroableOptionType(node) {
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            const zeroValue = node.zeroValue ? (visit(this)(node.zeroValue) ?? undefined) : undefined;
            if (zeroValue) assertIsNode(zeroValue, 'constantValueNode');
            return zeroableOptionTypeNode(item, {
                ...node,
                zeroValue,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('fixedSizeTransformNode')) {
        visitor.visitFixedSizeTransform = function visitFixedSizeTransform(node) {
            return fixedSizeTransformNode(node.size, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('hiddenPrefixTransformNode')) {
        visitor.visitHiddenPrefixTransform = function visitHiddenPrefixTransform(node) {
            return hiddenPrefixTransformNode(
                (node.prefix ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode')),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('hiddenSuffixTransformNode')) {
        visitor.visitHiddenSuffixTransform = function visitHiddenSuffixTransform(node) {
            return hiddenSuffixTransformNode(
                (node.suffix ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode')),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('postOffsetTransformNode')) {
        visitor.visitPostOffsetTransform = function visitPostOffsetTransform(node) {
            return postOffsetTransformNode(node.offset, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('preOffsetTransformNode')) {
        visitor.visitPreOffsetTransform = function visitPreOffsetTransform(node) {
            return preOffsetTransformNode(node.offset, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('sentinelTransformNode')) {
        visitor.visitSentinelTransform = function visitSentinelTransform(node) {
            const sentinel = visit(this)(node.sentinel);
            if (sentinel === null) return null;
            assertIsNode(sentinel, 'constantValueNode');
            return sentinelTransformNode(sentinel, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('sizePrefixTransformNode')) {
        visitor.visitSizePrefixTransform = function visitSizePrefixTransform(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNode(prefix, 'integerTypeNode');
            return sizePrefixTransformNode(prefix, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return arrayValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('booleanValueNode')) {
        visitor.visitBooleanValue = function visitBooleanValue(node) {
            return booleanValueNode(node.boolean, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('bytesValueNode')) {
        visitor.visitBytesValue = function visitBytesValue(node) {
            return bytesValueNode(node.encoding, node.data, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('constantValueNode')) {
        visitor.visitConstantValue = function visitConstantValue(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return constantValueNode(type, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            const enumLink = visit(this)(node.enum);
            if (enumLink === null) return null;
            assertIsNode(enumLink, 'definedTypeLinkNode');
            const value = node.value ? (visit(this)(node.value) ?? undefined) : undefined;
            if (value) assertIsNode(value, ['structValueNode', 'tupleValueNode']);
            return enumValueNode(enumLink, node.variant, {
                ...node,
                value,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('floatValueNode')) {
        visitor.visitFloatValue = function visitFloatValue(node) {
            return floatValueNode(node.value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('injectedValueNode')) {
        visitor.visitInjectedValue = function visitInjectedValue(node) {
            const fallback = node.fallback ? (visit(this)(node.fallback) ?? undefined) : undefined;
            if (fallback) assertIsNode(fallback, VALUE_NODES);
            return injectedValueNode({
                ...node,
                fallback,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('integerValueNode')) {
        visitor.visitIntegerValue = function visitIntegerValue(node) {
            return integerValueNode(node.value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('mapEntryValueNode')) {
        visitor.visitMapEntryValue = function visitMapEntryValue(node) {
            const key = visit(this)(node.key);
            if (key === null) return null;
            assertIsNode(key, VALUE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return mapEntryValueNode(key, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return mapValueNode(
                (node.entries ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('mapEntryValueNode')),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('noneValueNode')) {
        visitor.visitNoneValue = function visitNoneValue(node) {
            return noneValueNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('publicKeyValueNode')) {
        visitor.visitPublicKeyValue = function visitPublicKeyValue(node) {
            return publicKeyValueNode(node.publicKey, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return setValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return someValueNode(value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('stringValueNode')) {
        visitor.visitStringValue = function visitStringValue(node) {
            return stringValueNode(node.string, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return structFieldValueNode(node.identifier, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return structValueNode(
                (node.fields ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldValueNode')),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return tupleValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
                {
                    ...node,
                    plugins: node.plugins
                        ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                        : undefined,
                },
            );
        };
    }

    if (keys.includes('accountLinkNode')) {
        visitor.visitAccountLink = function visitAccountLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return accountLinkNode(node.identifier, {
                ...node,
                program,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('definedTypeLinkNode')) {
        visitor.visitDefinedTypeLink = function visitDefinedTypeLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return definedTypeLinkNode(node.identifier, {
                ...node,
                program,
                transforms: node.transforms
                    ? node.transforms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TRANSFORM_NODE_KINDS))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionAccountLinkNode')) {
        visitor.visitInstructionAccountLink = function visitInstructionAccountLink(node) {
            const instruction = node.instruction ? (visit(this)(node.instruction) ?? undefined) : undefined;
            if (instruction) assertIsNode(instruction, 'instructionLinkNode');
            return instructionAccountLinkNode(node.identifier, {
                ...node,
                instruction,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionLinkNode')) {
        visitor.visitInstructionLink = function visitInstructionLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return instructionLinkNode(node.identifier, {
                ...node,
                program,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('pdaLinkNode')) {
        visitor.visitPdaLink = function visitPdaLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return pdaLinkNode(node.identifier, {
                ...node,
                program,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('programLinkNode')) {
        visitor.visitProgramLink = function visitProgramLink(node) {
            return programLinkNode(node.identifier, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('constantPdaSeedNode')) {
        visitor.visitConstantPdaSeed = function visitConstantPdaSeed(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['programIdValueNode', ...VALUE_NODES]);
            return constantPdaSeedNode(type, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return variablePdaSeedNode(node.identifier, type, {
                ...node,
                docs,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('fixedCountNode')) {
        visitor.visitFixedCount = function visitFixedCount(node) {
            return fixedCountNode(node.value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNode(prefix, 'integerTypeNode');
            return prefixedCountNode(prefix, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('remainderCountNode')) {
        visitor.visitRemainderCount = function visitRemainderCount(node) {
            return remainderCountNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('sentinelCountNode')) {
        visitor.visitSentinelCount = function visitSentinelCount(node) {
            const sentinel = visit(this)(node.sentinel);
            if (sentinel === null) return null;
            assertIsNode(sentinel, 'constantValueNode');
            return sentinelCountNode(sentinel, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            const constant = visit(this)(node.constant);
            if (constant === null) return null;
            assertIsNode(constant, 'constantValueNode');
            return constantDiscriminatorNode(constant, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('fieldDiscriminatorNode')) {
        visitor.visitFieldDiscriminator = function visitFieldDiscriminator(node) {
            return fieldDiscriminatorNode(node.path, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('sizeDiscriminatorNode')) {
        visitor.visitSizeDiscriminator = function visitSizeDiscriminator(node) {
            return sizeDiscriminatorNode(node.size, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('amountNumberDisplayNode')) {
        visitor.visitAmountNumberDisplay = function visitAmountNumberDisplay(node) {
            const decimals = visit(this)(node.decimals);
            if (decimals === null) return null;
            assertIsNode(decimals, ['integerValueNode', 'injectedValueNode']);
            const unit = node.unit ? (visit(this)(node.unit) ?? undefined) : undefined;
            if (unit) assertIsNode(unit, ['stringValueNode', 'injectedValueNode']);
            return amountNumberDisplayNode({
                ...node,
                decimals,
                unit,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('enumVariantDisplayNode')) {
        visitor.visitEnumVariantDisplay = function visitEnumVariantDisplay(node) {
            let label = node.label;
            if (label !== undefined && typeof label !== 'string') {
                const visited = visit(this)(label) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                label = visited;
            }
            return enumVariantDisplayNode({
                ...node,
                label,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionAccountDisplayNode')) {
        visitor.visitInstructionAccountDisplay = function visitInstructionAccountDisplay(node) {
            let label = node.label;
            if (label !== undefined && typeof label !== 'string') {
                const visited = visit(this)(label) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                label = visited;
            }
            return instructionAccountDisplayNode({
                ...node,
                label,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionDisplayNode')) {
        visitor.visitInstructionDisplay = function visitInstructionDisplay(node) {
            let intent = node.intent;
            if (intent !== undefined && typeof intent !== 'string') {
                const visited = visit(this)(intent) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                intent = visited;
            }
            let interpolatedIntent = node.interpolatedIntent;
            if (interpolatedIntent !== undefined && typeof interpolatedIntent !== 'string') {
                const visited = visit(this)(interpolatedIntent) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                interpolatedIntent = visited;
            }
            return instructionDisplayNode({
                ...node,
                intent,
                interpolatedIntent,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('stringDisplayNode')) {
        visitor.visitStringDisplay = function visitStringDisplay(node) {
            return stringDisplayNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('structFieldDisplayNode')) {
        visitor.visitStructFieldDisplay = function visitStructFieldDisplay(node) {
            let label = node.label;
            if (label !== undefined && typeof label !== 'string') {
                const visited = visit(this)(label) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                label = visited;
            }
            let flattenPrefix = node.flattenPrefix;
            if (flattenPrefix !== undefined && typeof flattenPrefix !== 'string') {
                const visited = visit(this)(flattenPrefix) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                flattenPrefix = visited;
            }
            return structFieldDisplayNode({
                ...node,
                label,
                flattenPrefix,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('unitNumberDisplayNode')) {
        visitor.visitUnitNumberDisplay = function visitUnitNumberDisplay(node) {
            const unit = visit(this)(node.unit);
            if (unit === null) return null;
            assertIsNode(unit, ['stringValueNode', 'injectedValueNode']);
            return unitNumberDisplayNode({
                ...node,
                unit,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('accountBumpValueNode')) {
        visitor.visitAccountBumpValue = function visitAccountBumpValue(node) {
            return accountBumpValueNode(node.identifier, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('accountDataValueNode')) {
        visitor.visitAccountDataValue = function visitAccountDataValue(node) {
            return accountDataValueNode(node.account, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('accountValueNode')) {
        visitor.visitAccountValue = function visitAccountValue(node) {
            return accountValueNode(node.identifier, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('dataValueNode')) {
        visitor.visitDataValue = function visitDataValue(node) {
            return dataValueNode(node.path, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            const condition = visit(this)(node.condition);
            if (condition === null) return null;
            assertIsNode(condition, ['accountValueNode', 'dataValueNode']);
            const value = node.value ? (visit(this)(node.value) ?? undefined) : undefined;
            if (value) assertIsNode(value, VALUE_NODES);
            const ifTrue = node.ifTrue ? (visit(this)(node.ifTrue) ?? undefined) : undefined;
            if (ifTrue) assertIsNode(ifTrue, INSTRUCTION_INPUT_VALUE_NODES);
            const ifFalse = node.ifFalse ? (visit(this)(node.ifFalse) ?? undefined) : undefined;
            if (ifFalse) assertIsNode(ifFalse, INSTRUCTION_INPUT_VALUE_NODES);
            return conditionalValueNode({
                ...node,
                condition,
                value,
                ifTrue,
                ifFalse,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('identityValueNode')) {
        visitor.visitIdentityValue = function visitIdentityValue(node) {
            return identityValueNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('payerValueNode')) {
        visitor.visitPayerValue = function visitPayerValue(node) {
            return payerValueNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['accountValueNode', 'dataValueNode', ...VALUE_NODES]);
            return pdaSeedValueNode(node.identifier, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            const pda = visit(this)(node.pda);
            if (pda === null) return null;
            assertIsNode(pda, ['pdaLinkNode', 'pdaNode']);
            const programId = node.programId ? (visit(this)(node.programId) ?? undefined) : undefined;
            if (programId) assertIsNode(programId, ['accountValueNode', 'dataValueNode']);
            return pdaValueNode(pda, {
                ...node,
                seeds: (node.seeds ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaSeedValueNode')),
                programId,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('programIdValueNode')) {
        visitor.visitProgramIdValue = function visitProgramIdValue(node) {
            return programIdValueNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const data = visit(this)(node.data);
            if (data === null) return null;
            assertIsNode(data, TYPE_NODES);
            const pda = node.pda ? (visit(this)(node.pda) ?? undefined) : undefined;
            if (pda) assertIsNode(pda, 'pdaLinkNode');
            return accountNode({
                ...node,
                docs,
                data,
                pda,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('constantNode')) {
        visitor.visitConstant = function visitConstant(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return constantNode(node.identifier, type, value, {
                ...node,
                docs,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return definedTypeNode({
                ...node,
                docs,
                type,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('errorNode')) {
        visitor.visitError = function visitError(node) {
            let message = node.message;
            if (typeof message !== 'string') {
                const visited = visit(this)(message);
                if (visited === null) return null;
                assertIsNode(visited, 'textNode');
                message = visited;
            }
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            return errorNode({
                ...node,
                message,
                docs,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('eventNode')) {
        visitor.visitEvent = function visitEvent(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const data = visit(this)(node.data);
            if (data === null) return null;
            assertIsNode(data, TYPE_NODES);
            return eventNode({
                ...node,
                docs,
                data,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const defaultValue = node.defaultValue ? (visit(this)(node.defaultValue) ?? undefined) : undefined;
            if (defaultValue) assertIsNode(defaultValue, INSTRUCTION_INPUT_VALUE_NODES);
            const accountLink = node.accountLink ? (visit(this)(node.accountLink) ?? undefined) : undefined;
            if (accountLink) assertIsNode(accountLink, 'accountLinkNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionAccountDisplayNode');
            return instructionAccountNode({
                ...node,
                docs,
                defaultValue,
                accountLink,
                display,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['accountLinkNode', 'dataValueNode', 'integerValueNode']);
            return instructionByteDeltaNode(value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            const status = node.status ? (visit(this)(node.status) ?? undefined) : undefined;
            if (status) assertIsNode(status, 'instructionStatusNode');
            const data = node.data ? (visit(this)(node.data) ?? undefined) : undefined;
            if (data) assertIsNode(data, TYPE_NODES);
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionDisplayNode');
            return instructionNode({
                ...node,
                status,
                accounts: (node.accounts ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionAccountNode')),
                data,
                byteDeltas: node.byteDeltas
                    ? node.byteDeltas
                          .map(visit(this))
                          .filter(removeNullAndAssertIsNodeFilter('instructionByteDeltaNode'))
                    : undefined,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
                docs,
                remainingAccounts: node.remainingAccounts
                    ? node.remainingAccounts
                          .map(visit(this))
                          .filter(removeNullAndAssertIsNodeFilter('instructionRemainingAccountsNode'))
                    : undefined,
                subInstructions: node.subInstructions
                    ? node.subInstructions.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('instructionNode'))
                    : undefined,
                provides: node.provides
                    ? node.provides.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('providedNode'))
                    : undefined,
                display,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionRemainingAccountsNode')) {
        visitor.visitInstructionRemainingAccounts = function visitInstructionRemainingAccounts(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionAccountDisplayNode');
            return instructionRemainingAccountsNode(node.identifier, {
                ...node,
                docs,
                display,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionStatusNode')) {
        visitor.visitInstructionStatus = function visitInstructionStatus(node) {
            let message = node.message;
            if (message !== undefined && typeof message !== 'string') {
                const visited = visit(this)(message) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                message = visited;
            }
            return instructionStatusNode(node.lifecycle, {
                ...node,
                message,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            return pdaNode({
                ...node,
                docs,
                seeds: (node.seeds ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(PDA_SEED_NODES)),
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('pluginNode')) {
        visitor.visitPlugin = function visitPlugin(node) {
            return pluginNode(node.namespace, node.payload, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            let docs = node.docs;
            if (docs !== undefined && typeof docs !== 'string') {
                const visited = visit(this)(docs) ?? undefined;
                if (visited !== undefined) assertIsNode(visited, 'textNode');
                docs = visited;
            }
            return programNode({
                ...node,
                accounts: (node.accounts ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('accountNode')),
                constants: (node.constants ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('constantNode')),
                definedTypes: (node.definedTypes ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('definedTypeNode')),
                docs,
                errors: (node.errors ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('errorNode')),
                events: (node.events ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('eventNode')),
                instructions: (node.instructions ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionNode')),
                pdas: (node.pdas ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaNode')),
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('providedNode')) {
        visitor.visitProvided = function visitProvided(node) {
            const value = visit(this)(node.node);
            if (value === null) return null;
            assertIsNode(value, REGISTERED_NODE_KINDS);
            return providedNode(node.identifier, value, {
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            const program = visit(this)(node.program);
            if (program === null) return null;
            assertIsNode(program, 'programNode');
            return rootNode(program, {
                ...node,
                additionalPrograms: (node.additionalPrograms ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('programNode')),
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    if (keys.includes('textNode')) {
        visitor.visitText = function visitText(node) {
            return textNode({
                ...node,
                plugins: node.plugins
                    ? node.plugins.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pluginNode'))
                    : undefined,
            });
        };
    }

    return visitor as Visitor<Node, TNodeKind>;
}
