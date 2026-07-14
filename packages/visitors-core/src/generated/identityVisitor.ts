import {
    accountLinkNode,
    accountNode,
    amountNumberDisplayNode,
    amountTypeNode,
    arrayTypeNode,
    arrayValueNode,
    assertIsNestedTypeNode,
    assertIsNode,
    booleanTypeNode,
    conditionalValueNode,
    constantDiscriminatorNode,
    constantNode,
    constantPdaSeedNode,
    constantValueNode,
    COUNT_NODES,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    DISCRIMINATOR_NODES,
    ENUM_VARIANT_TYPE_NODES,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    eventNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    hiddenSuffixTypeNode,
    injectedValueNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    instructionAccountLinkNode,
    instructionAccountNode,
    instructionArgumentLinkNode,
    instructionArgumentNode,
    instructionByteDeltaNode,
    instructionLinkNode,
    instructionNode,
    instructionRemainingAccountsNode,
    mapEntryValueNode,
    mapTypeNode,
    mapValueNode,
    numberTypeNode,
    optionTypeNode,
    PDA_SEED_NODES,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    postOffsetTypeNode,
    prefixedCountNode,
    preOffsetTypeNode,
    programNode,
    providedNode,
    REGISTERED_NODE_KINDS,
    remainderOptionTypeNode,
    removeNullAndAssertIsNodeFilter,
    resolverValueNode,
    rootNode,
    sentinelTypeNode,
    setTypeNode,
    setValueNode,
    sizePrefixTypeNode,
    solAmountTypeNode,
    someValueNode,
    stringTypeNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    tupleTypeNode,
    tupleValueNode,
    type Node,
    type NodeKind,
    TYPE_NODES,
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

    if (keys.includes('amountTypeNode')) {
        visitor.visitAmountType = function visitAmountType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return amountTypeNode(number, node.decimals, node.unit);
        };
    }

    if (keys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            const count = visit(this)(node.count);
            if (count === null) return null;
            assertIsNode(count, COUNT_NODES);
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return arrayTypeNode(item, count);
        };
    }

    if (keys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            const size = visit(this)(node.size);
            if (size === null) return null;
            assertIsNestedTypeNode(size, 'numberTypeNode');
            return booleanTypeNode(size);
        };
    }

    if (keys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return dateTimeTypeNode(number);
        };
    }

    if (keys.includes('enumEmptyVariantTypeNode')) {
        visitor.visitEnumEmptyVariantType = function visitEnumEmptyVariantType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'enumVariantDisplayNode');
            return enumEmptyVariantTypeNode(node.name, node.discriminator, { ...node, display });
        };
    }

    if (keys.includes('enumStructVariantTypeNode')) {
        visitor.visitEnumStructVariantType = function visitEnumStructVariantType(node) {
            const struct = visit(this)(node.struct);
            if (struct === null) return null;
            assertIsNestedTypeNode(struct, 'structTypeNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'enumVariantDisplayNode');
            return enumStructVariantTypeNode(node.name, struct, node.discriminator, { ...node, display });
        };
    }

    if (keys.includes('enumTupleVariantTypeNode')) {
        visitor.visitEnumTupleVariantType = function visitEnumTupleVariantType(node) {
            const tuple = visit(this)(node.tuple);
            if (tuple === null) return null;
            assertIsNestedTypeNode(tuple, 'tupleTypeNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'enumVariantDisplayNode');
            return enumTupleVariantTypeNode(node.name, tuple, node.discriminator, { ...node, display });
        };
    }

    if (keys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            const size = visit(this)(node.size);
            if (size === null) return null;
            assertIsNestedTypeNode(size, 'numberTypeNode');
            return enumTypeNode(
                (node.variants ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(ENUM_VARIANT_TYPE_NODES)),
                { ...node, size },
            );
        };
    }

    if (keys.includes('fixedSizeTypeNode')) {
        visitor.visitFixedSizeType = function visitFixedSizeType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return fixedSizeTypeNode(type, node.size);
        };
    }

    if (keys.includes('hiddenPrefixTypeNode')) {
        visitor.visitHiddenPrefixType = function visitHiddenPrefixType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return hiddenPrefixTypeNode(
                type,
                (node.prefix ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode')),
            );
        };
    }

    if (keys.includes('hiddenSuffixTypeNode')) {
        visitor.visitHiddenSuffixType = function visitHiddenSuffixType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return hiddenSuffixTypeNode(
                type,
                (node.suffix ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode')),
            );
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
            return mapTypeNode(key, value, count);
        };
    }

    if (keys.includes('numberTypeNode')) {
        visitor.visitNumberType = function visitNumberType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display)
                assertIsNode(display, [
                    'amountNumberDisplayNode',
                    'dateTimeNumberDisplayNode',
                    'durationNumberDisplayNode',
                ]);
            return numberTypeNode(node.format, node.endian, { ...node, display });
        };
    }

    if (keys.includes('optionTypeNode')) {
        visitor.visitOptionType = function visitOptionType(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNestedTypeNode(prefix, 'numberTypeNode');
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return optionTypeNode(item, { ...node, prefix });
        };
    }

    if (keys.includes('postOffsetTypeNode')) {
        visitor.visitPostOffsetType = function visitPostOffsetType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return postOffsetTypeNode(type, node.offset, node.strategy);
        };
    }

    if (keys.includes('preOffsetTypeNode')) {
        visitor.visitPreOffsetType = function visitPreOffsetType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return preOffsetTypeNode(type, node.offset, node.strategy);
        };
    }

    if (keys.includes('remainderOptionTypeNode')) {
        visitor.visitRemainderOptionType = function visitRemainderOptionType(node) {
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return remainderOptionTypeNode(item);
        };
    }

    if (keys.includes('sentinelTypeNode')) {
        visitor.visitSentinelType = function visitSentinelType(node) {
            const sentinel = visit(this)(node.sentinel);
            if (sentinel === null) return null;
            assertIsNode(sentinel, 'constantValueNode');
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return sentinelTypeNode(type, sentinel);
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
            return setTypeNode(item, count);
        };
    }

    if (keys.includes('sizePrefixTypeNode')) {
        visitor.visitSizePrefixType = function visitSizePrefixType(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNestedTypeNode(prefix, 'numberTypeNode');
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return sizePrefixTypeNode(type, prefix);
        };
    }

    if (keys.includes('solAmountTypeNode')) {
        visitor.visitSolAmountType = function visitSolAmountType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return solAmountTypeNode(number);
        };
    }

    if (keys.includes('stringTypeNode')) {
        visitor.visitStringType = function visitStringType(node) {
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'stringDisplayNode');
            return stringTypeNode(node.encoding, { ...node, display });
        };
    }

    if (keys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const defaultValue = node.defaultValue ? (visit(this)(node.defaultValue) ?? undefined) : undefined;
            if (defaultValue) assertIsNode(defaultValue, VALUE_NODES);
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'structFieldDisplayNode');
            return structFieldTypeNode({ ...node, type, defaultValue, display });
        };
    }

    if (keys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            return structTypeNode(
                (node.fields ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldTypeNode')),
            );
        };
    }

    if (keys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            return tupleTypeNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TYPE_NODES)),
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
            return zeroableOptionTypeNode(item, zeroValue);
        };
    }

    if (keys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return arrayValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
            );
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
            return constantValueNode(type, value);
        };
    }

    if (keys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            const enumLink = visit(this)(node.enum);
            if (enumLink === null) return null;
            assertIsNode(enumLink, 'definedTypeLinkNode');
            const value = node.value ? (visit(this)(node.value) ?? undefined) : undefined;
            if (value) assertIsNode(value, ['structValueNode', 'tupleValueNode']);
            return enumValueNode(enumLink, node.variant, value);
        };
    }

    if (keys.includes('injectedValueNode')) {
        visitor.visitInjectedValue = function visitInjectedValue(node) {
            const fallback = node.fallback ? (visit(this)(node.fallback) ?? undefined) : undefined;
            if (fallback) assertIsNode(fallback, VALUE_NODES);
            return injectedValueNode({ ...node, fallback });
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
            return mapEntryValueNode(key, value);
        };
    }

    if (keys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return mapValueNode(
                (node.entries ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('mapEntryValueNode')),
            );
        };
    }

    if (keys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return setValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
            );
        };
    }

    if (keys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return someValueNode(value);
        };
    }

    if (keys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return structFieldValueNode(node.name, value);
        };
    }

    if (keys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return structValueNode(
                (node.fields ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldValueNode')),
            );
        };
    }

    if (keys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return tupleValueNode(
                (node.items ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)),
            );
        };
    }

    if (keys.includes('accountLinkNode')) {
        visitor.visitAccountLink = function visitAccountLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return accountLinkNode(node.name, program);
        };
    }

    if (keys.includes('definedTypeLinkNode')) {
        visitor.visitDefinedTypeLink = function visitDefinedTypeLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return definedTypeLinkNode(node.name, program);
        };
    }

    if (keys.includes('instructionAccountLinkNode')) {
        visitor.visitInstructionAccountLink = function visitInstructionAccountLink(node) {
            const instruction = node.instruction ? (visit(this)(node.instruction) ?? undefined) : undefined;
            if (instruction) assertIsNode(instruction, 'instructionLinkNode');
            return instructionAccountLinkNode(node.name, instruction);
        };
    }

    if (keys.includes('instructionArgumentLinkNode')) {
        visitor.visitInstructionArgumentLink = function visitInstructionArgumentLink(node) {
            const instruction = node.instruction ? (visit(this)(node.instruction) ?? undefined) : undefined;
            if (instruction) assertIsNode(instruction, 'instructionLinkNode');
            return instructionArgumentLinkNode(node.name, instruction);
        };
    }

    if (keys.includes('instructionLinkNode')) {
        visitor.visitInstructionLink = function visitInstructionLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return instructionLinkNode(node.name, program);
        };
    }

    if (keys.includes('pdaLinkNode')) {
        visitor.visitPdaLink = function visitPdaLink(node) {
            const program = node.program ? (visit(this)(node.program) ?? undefined) : undefined;
            if (program) assertIsNode(program, 'programLinkNode');
            return pdaLinkNode(node.name, program);
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
            return constantPdaSeedNode(type, value);
        };
    }

    if (keys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return variablePdaSeedNode(node.name, type, node.docs);
        };
    }

    if (keys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNestedTypeNode(prefix, 'numberTypeNode');
            return prefixedCountNode(prefix);
        };
    }

    if (keys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            const constant = visit(this)(node.constant);
            if (constant === null) return null;
            assertIsNode(constant, 'constantValueNode');
            return constantDiscriminatorNode(constant, node.offset);
        };
    }

    if (keys.includes('amountNumberDisplayNode')) {
        visitor.visitAmountNumberDisplay = function visitAmountNumberDisplay(node) {
            const decimals = node.decimals ? (visit(this)(node.decimals) ?? undefined) : undefined;
            if (decimals) assertIsNode(decimals, ['numberValueNode', 'injectedValueNode']);
            const unit = node.unit ? (visit(this)(node.unit) ?? undefined) : undefined;
            if (unit) assertIsNode(unit, ['stringValueNode', 'injectedValueNode']);
            return amountNumberDisplayNode({ ...node, decimals, unit });
        };
    }

    if (keys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            const condition = visit(this)(node.condition);
            if (condition === null) return null;
            assertIsNode(condition, ['accountValueNode', 'argumentValueNode', 'resolverValueNode']);
            const value = node.value ? (visit(this)(node.value) ?? undefined) : undefined;
            if (value) assertIsNode(value, VALUE_NODES);
            const ifTrue = node.ifTrue ? (visit(this)(node.ifTrue) ?? undefined) : undefined;
            if (ifTrue) assertIsNode(ifTrue, INSTRUCTION_INPUT_VALUE_NODES);
            const ifFalse = node.ifFalse ? (visit(this)(node.ifFalse) ?? undefined) : undefined;
            if (ifFalse) assertIsNode(ifFalse, INSTRUCTION_INPUT_VALUE_NODES);
            return conditionalValueNode({ ...node, condition, value, ifTrue, ifFalse });
        };
    }

    if (keys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['accountValueNode', 'argumentValueNode', ...VALUE_NODES]);
            return pdaSeedValueNode(node.name, value);
        };
    }

    if (keys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            const pda = visit(this)(node.pda);
            if (pda === null) return null;
            assertIsNode(pda, ['pdaLinkNode', 'pdaNode']);
            const programId = node.programId ? (visit(this)(node.programId) ?? undefined) : undefined;
            if (programId) assertIsNode(programId, ['accountValueNode', 'argumentValueNode']);
            return pdaValueNode(
                pda,
                (node.seeds ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaSeedValueNode')),
                programId,
            );
        };
    }

    if (keys.includes('resolverValueNode')) {
        visitor.visitResolverValue = function visitResolverValue(node) {
            return resolverValueNode(node.name, {
                ...node,
                dependsOn: node.dependsOn
                    ? node.dependsOn
                          .map(visit(this))
                          .filter(removeNullAndAssertIsNodeFilter(['accountValueNode', 'argumentValueNode']))
                    : undefined,
            });
        };
    }

    if (keys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            const data = visit(this)(node.data);
            if (data === null) return null;
            assertIsNestedTypeNode(data, 'structTypeNode');
            const pda = node.pda ? (visit(this)(node.pda) ?? undefined) : undefined;
            if (pda) assertIsNode(pda, 'pdaLinkNode');
            return accountNode({
                ...node,
                data,
                pda,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
            });
        };
    }

    if (keys.includes('constantNode')) {
        visitor.visitConstant = function visitConstant(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return constantNode(node.name, type, value, node.docs);
        };
    }

    if (keys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return definedTypeNode({ ...node, type });
        };
    }

    if (keys.includes('eventNode')) {
        visitor.visitEvent = function visitEvent(node) {
            const data = visit(this)(node.data);
            if (data === null) return null;
            assertIsNode(data, TYPE_NODES);
            return eventNode({
                ...node,
                data,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
            });
        };
    }

    if (keys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            const defaultValue = node.defaultValue ? (visit(this)(node.defaultValue) ?? undefined) : undefined;
            if (defaultValue) assertIsNode(defaultValue, INSTRUCTION_INPUT_VALUE_NODES);
            const accountLink = node.accountLink ? (visit(this)(node.accountLink) ?? undefined) : undefined;
            if (accountLink) assertIsNode(accountLink, 'accountLinkNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionAccountDisplayNode');
            return instructionAccountNode({ ...node, defaultValue, accountLink, display });
        };
    }

    if (keys.includes('instructionArgumentNode')) {
        visitor.visitInstructionArgument = function visitInstructionArgument(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const defaultValue = node.defaultValue ? (visit(this)(node.defaultValue) ?? undefined) : undefined;
            if (defaultValue) assertIsNode(defaultValue, INSTRUCTION_INPUT_VALUE_NODES);
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'structFieldDisplayNode');
            return instructionArgumentNode({ ...node, type, defaultValue, display });
        };
    }

    if (keys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['accountLinkNode', 'argumentValueNode', 'numberValueNode', 'resolverValueNode']);
            return instructionByteDeltaNode(value, { ...node });
        };
    }

    if (keys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            const status = node.status ? (visit(this)(node.status) ?? undefined) : undefined;
            if (status) assertIsNode(status, 'instructionStatusNode');
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionDisplayNode');
            return instructionNode({
                ...node,
                status,
                accounts: (node.accounts ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionAccountNode')),
                arguments: (node.arguments ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionArgumentNode')),
                byteDeltas: node.byteDeltas
                    ? node.byteDeltas
                          .map(visit(this))
                          .filter(removeNullAndAssertIsNodeFilter('instructionByteDeltaNode'))
                    : undefined,
                discriminators: node.discriminators
                    ? node.discriminators.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(DISCRIMINATOR_NODES))
                    : undefined,
                extraArguments: node.extraArguments
                    ? node.extraArguments
                          .map(visit(this))
                          .filter(removeNullAndAssertIsNodeFilter('instructionArgumentNode'))
                    : undefined,
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
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['argumentValueNode', 'resolverValueNode']);
            const display = node.display ? (visit(this)(node.display) ?? undefined) : undefined;
            if (display) assertIsNode(display, 'instructionAccountDisplayNode');
            return instructionRemainingAccountsNode(value, { ...node, display });
        };
    }

    if (keys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            return pdaNode({
                ...node,
                seeds: (node.seeds ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter(PDA_SEED_NODES)),
            });
        };
    }

    if (keys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            return programNode({
                ...node,
                accounts: (node.accounts ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('accountNode')),
                constants: (node.constants ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('constantNode')),
                definedTypes: (node.definedTypes ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('definedTypeNode')),
                errors: (node.errors ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('errorNode')),
                events: (node.events ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('eventNode')),
                instructions: (node.instructions ?? [])
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionNode')),
                pdas: (node.pdas ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaNode')),
            });
        };
    }

    if (keys.includes('providedNode')) {
        visitor.visitProvided = function visitProvided(node) {
            const value = visit(this)(node.node);
            if (value === null) return null;
            assertIsNode(value, REGISTERED_NODE_KINDS);
            return providedNode(node.name, value);
        };
    }

    if (keys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            const program = visit(this)(node.program);
            if (program === null) return null;
            assertIsNode(program, 'programNode');
            return rootNode(
                program,
                (node.additionalPrograms ?? []).map(visit(this)).filter(removeNullAndAssertIsNodeFilter('programNode')),
            );
        };
    }

    return visitor as Visitor<Node, TNodeKind>;
}
