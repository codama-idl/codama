import {
    accountNode,
    amountTypeNode,
    arrayTypeNode,
    arrayValueNode,
    assertIsNestedTypeNode,
    assertIsNode,
    booleanTypeNode,
    conditionalValueNode,
    constantDiscriminatorNode,
    constantPdaSeedNode,
    constantValueNode,
    COUNT_NODES,
    dateTimeTypeNode,
    definedTypeNode,
    DISCRIMINATOR_NODES,
    ENUM_VARIANT_TYPE_NODES,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    hiddenSuffixTypeNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    instructionAccountNode,
    instructionArgumentNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    mapEntryValueNode,
    mapTypeNode,
    mapValueNode,
    Node,
    NodeKind,
    optionTypeNode,
    PDA_SEED_NODES,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    postOffsetTypeNode,
    prefixedCountNode,
    preOffsetTypeNode,
    programNode,
    REGISTERED_NODE_KINDS,
    removeNullAndAssertIsNodeFilter,
    resolverValueNode,
    rootNode,
    sentinelTypeNode,
    setTypeNode,
    setValueNode,
    sizePrefixTypeNode,
    solAmountTypeNode,
    someValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    tupleTypeNode,
    tupleValueNode,
    TYPE_NODES,
    VALUE_NODES,
    variablePdaSeedNode,
    zeroableOptionTypeNode,
} from '@kinobi-so/nodes';

import { staticVisitor } from './staticVisitor';
import { visit as baseVisit, Visitor } from './visitor';

export function identityVisitor<TNodeKind extends NodeKind = NodeKind>(
    nodeKeys: TNodeKind[] = REGISTERED_NODE_KINDS as TNodeKind[],
): Visitor<Node | null, TNodeKind> {
    const castedNodeKeys: NodeKind[] = nodeKeys;
    const visitor = staticVisitor(node => Object.freeze({ ...node }), castedNodeKeys) as Visitor<Node | null>;
    const visit =
        (v: Visitor<Node | null>) =>
        (node: Node): Node | null =>
            castedNodeKeys.includes(node.kind) ? baseVisit(node, v) : Object.freeze({ ...node });

    if (castedNodeKeys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            const program = visit(this)(node.program);
            if (program === null) return null;
            assertIsNode(program, 'programNode');
            return rootNode(
                program,
                node.additionalPrograms.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('programNode')),
            );
        };
    }

    if (castedNodeKeys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            return programNode({
                ...node,
                accounts: node.accounts.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('accountNode')),
                definedTypes: node.definedTypes
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('definedTypeNode')),
                errors: node.errors.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('errorNode')),
                instructions: node.instructions
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionNode')),
                pdas: node.pdas.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaNode')),
            });
        };
    }

    if (castedNodeKeys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            return pdaNode({
                ...node,
                seeds: node.seeds.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(PDA_SEED_NODES)),
            });
        };
    }

    if (castedNodeKeys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            const data = visit(this)(node.data);
            if (data === null) return null;
            assertIsNode(data, 'structTypeNode');
            const pda = node.pda ? visit(this)(node.pda) ?? undefined : undefined;
            if (pda) assertIsNode(pda, 'pdaLinkNode');
            return accountNode({ ...node, data, pda });
        };
    }

    if (castedNodeKeys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            return instructionNode({
                ...node,
                accounts: node.accounts
                    .map(visit(this))
                    .filter(removeNullAndAssertIsNodeFilter('instructionAccountNode')),
                arguments: node.arguments
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
            });
        };
    }

    if (castedNodeKeys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            const defaultValue = node.defaultValue ? visit(this)(node.defaultValue) ?? undefined : undefined;
            if (defaultValue) assertIsNode(defaultValue, INSTRUCTION_INPUT_VALUE_NODES);
            return instructionAccountNode({ ...node, defaultValue });
        };
    }

    if (castedNodeKeys.includes('instructionArgumentNode')) {
        visitor.visitInstructionArgument = function visitInstructionArgument(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const defaultValue = node.defaultValue ? visit(this)(node.defaultValue) ?? undefined : undefined;
            if (defaultValue) assertIsNode(defaultValue, INSTRUCTION_INPUT_VALUE_NODES);
            return instructionArgumentNode({ ...node, defaultValue, type });
        };
    }

    if (castedNodeKeys.includes('instructionRemainingAccountsNode')) {
        visitor.visitInstructionRemainingAccounts = function visitInstructionRemainingAccounts(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['argumentValueNode', 'resolverValueNode']);
            return instructionRemainingAccountsNode(value, { ...node });
        };
    }

    if (castedNodeKeys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, ['numberValueNode', 'accountLinkNode', 'argumentValueNode', 'resolverValueNode']);
            return instructionByteDeltaNode(value, { ...node });
        };
    }

    if (castedNodeKeys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return definedTypeNode({ ...node, type });
        };
    }

    if (castedNodeKeys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            const size = visit(this)(node.count);
            if (size === null) return null;
            assertIsNode(size, COUNT_NODES);
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return arrayTypeNode(item, size);
        };
    }

    if (castedNodeKeys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            return enumTypeNode(
                node.variants.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(ENUM_VARIANT_TYPE_NODES)),
                { size: node.size },
            );
        };
    }

    if (castedNodeKeys.includes('enumStructVariantTypeNode')) {
        visitor.visitEnumStructVariantType = function visitEnumStructVariantType(node) {
            const newStruct = visit(this)(node.struct);
            if (!newStruct) {
                return enumEmptyVariantTypeNode(node.name);
            }
            assertIsNode(newStruct, 'structTypeNode');
            if (newStruct.fields.length === 0) {
                return enumEmptyVariantTypeNode(node.name);
            }
            return enumStructVariantTypeNode(node.name, newStruct);
        };
    }

    if (castedNodeKeys.includes('enumTupleVariantTypeNode')) {
        visitor.visitEnumTupleVariantType = function visitEnumTupleVariantType(node) {
            const newTuple = visit(this)(node.tuple);
            if (!newTuple) {
                return enumEmptyVariantTypeNode(node.name);
            }
            assertIsNode(newTuple, 'tupleTypeNode');
            if (newTuple.items.length === 0) {
                return enumEmptyVariantTypeNode(node.name);
            }
            return enumTupleVariantTypeNode(node.name, newTuple);
        };
    }

    if (castedNodeKeys.includes('mapTypeNode')) {
        visitor.visitMapType = function visitMapType(node) {
            const size = visit(this)(node.count);
            if (size === null) return null;
            assertIsNode(size, COUNT_NODES);
            const key = visit(this)(node.key);
            if (key === null) return null;
            assertIsNode(key, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, TYPE_NODES);
            return mapTypeNode(key, value, size);
        };
    }

    if (castedNodeKeys.includes('optionTypeNode')) {
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

    if (castedNodeKeys.includes('zeroableOptionTypeNode')) {
        visitor.visitZeroableOptionType = function visitZeroableOptionType(node) {
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            const zeroValue = node.zeroValue ? visit(this)(node.zeroValue) ?? undefined : undefined;
            if (zeroValue) assertIsNode(zeroValue, 'constantValueNode');
            return zeroableOptionTypeNode(item, zeroValue);
        };
    }

    if (castedNodeKeys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            const size = visit(this)(node.size);
            if (size === null) return null;
            assertIsNestedTypeNode(size, 'numberTypeNode');
            return booleanTypeNode(size);
        };
    }

    if (castedNodeKeys.includes('setTypeNode')) {
        visitor.visitSetType = function visitSetType(node) {
            const size = visit(this)(node.count);
            if (size === null) return null;
            assertIsNode(size, COUNT_NODES);
            const item = visit(this)(node.item);
            if (item === null) return null;
            assertIsNode(item, TYPE_NODES);
            return setTypeNode(item, size);
        };
    }

    if (castedNodeKeys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            const fields = node.fields.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldTypeNode'));
            return structTypeNode(fields);
        };
    }

    if (castedNodeKeys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const defaultValue = node.defaultValue ? visit(this)(node.defaultValue) ?? undefined : undefined;
            if (defaultValue) assertIsNode(defaultValue, VALUE_NODES);
            return structFieldTypeNode({ ...node, defaultValue, type });
        };
    }

    if (castedNodeKeys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            const items = node.items.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(TYPE_NODES));
            return tupleTypeNode(items);
        };
    }

    if (castedNodeKeys.includes('amountTypeNode')) {
        visitor.visitAmountType = function visitAmountType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return amountTypeNode(number, node.decimals, node.unit);
        };
    }

    if (castedNodeKeys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return dateTimeTypeNode(number);
        };
    }

    if (castedNodeKeys.includes('solAmountTypeNode')) {
        visitor.visitSolAmountType = function visitSolAmountType(node) {
            const number = visit(this)(node.number);
            if (number === null) return null;
            assertIsNestedTypeNode(number, 'numberTypeNode');
            return solAmountTypeNode(number);
        };
    }

    if (castedNodeKeys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            const prefix = visit(this)(node.prefix);
            if (prefix === null) return null;
            assertIsNestedTypeNode(prefix, 'numberTypeNode');
            return prefixedCountNode(prefix);
        };
    }

    if (castedNodeKeys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return arrayValueNode(node.items.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)));
        };
    }

    if (castedNodeKeys.includes('constantValueNode')) {
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

    if (castedNodeKeys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            const enumLink = visit(this)(node.enum);
            if (enumLink === null) return null;
            assertIsNode(enumLink, ['definedTypeLinkNode']);
            const value = node.value ? visit(this)(node.value) ?? undefined : undefined;
            if (value) assertIsNode(value, ['structValueNode', 'tupleValueNode']);
            return enumValueNode(enumLink, node.variant, value);
        };
    }

    if (castedNodeKeys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return mapValueNode(
                node.entries.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('mapEntryValueNode')),
            );
        };
    }

    if (castedNodeKeys.includes('mapEntryValueNode')) {
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

    if (castedNodeKeys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return setValueNode(node.items.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)));
        };
    }

    if (castedNodeKeys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return someValueNode(value);
        };
    }

    if (castedNodeKeys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return structValueNode(
                node.fields.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('structFieldValueNode')),
            );
        };
    }

    if (castedNodeKeys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, VALUE_NODES);
            return structFieldValueNode(node.name, value);
        };
    }

    if (castedNodeKeys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return tupleValueNode(node.items.map(visit(this)).filter(removeNullAndAssertIsNodeFilter(VALUE_NODES)));
        };
    }

    if (castedNodeKeys.includes('constantPdaSeedNode')) {
        visitor.visitConstantPdaSeed = function visitConstantPdaSeed(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, [...VALUE_NODES, 'programIdValueNode']);
            return constantPdaSeedNode(type, value);
        };
    }

    if (castedNodeKeys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return variablePdaSeedNode(node.name, type, node.docs);
        };
    }

    if (castedNodeKeys.includes('resolverValueNode')) {
        visitor.visitResolverValue = function visitResolverValue(node) {
            const dependsOn = (node.dependsOn ?? [])
                .map(visit(this))
                .filter(removeNullAndAssertIsNodeFilter(['accountValueNode', 'argumentValueNode']));
            return resolverValueNode(node.name, {
                ...node,
                dependsOn: dependsOn.length === 0 ? undefined : dependsOn,
            });
        };
    }

    if (castedNodeKeys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            const condition = visit(this)(node.condition);
            if (condition === null) return null;
            assertIsNode(condition, ['resolverValueNode', 'accountValueNode', 'argumentValueNode']);
            const value = node.value ? visit(this)(node.value) ?? undefined : undefined;
            if (value) assertIsNode(value, VALUE_NODES);
            const ifTrue = node.ifTrue ? visit(this)(node.ifTrue) ?? undefined : undefined;
            if (ifTrue) assertIsNode(ifTrue, INSTRUCTION_INPUT_VALUE_NODES);
            const ifFalse = node.ifFalse ? visit(this)(node.ifFalse) ?? undefined : undefined;
            if (ifFalse) assertIsNode(ifFalse, INSTRUCTION_INPUT_VALUE_NODES);
            if (!ifTrue && !ifFalse) return null;
            return conditionalValueNode({ condition, ifFalse, ifTrue, value });
        };
    }

    if (castedNodeKeys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            const pda = visit(this)(node.pda);
            if (pda === null) return null;
            assertIsNode(pda, ['pdaLinkNode', 'pdaNode']);
            const seeds = node.seeds.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('pdaSeedValueNode'));
            return pdaValueNode(pda, seeds);
        };
    }

    if (castedNodeKeys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            const value = visit(this)(node.value);
            if (value === null) return null;
            assertIsNode(value, [...VALUE_NODES, 'accountValueNode', 'argumentValueNode']);
            return pdaSeedValueNode(node.name, value);
        };
    }

    if (castedNodeKeys.includes('fixedSizeTypeNode')) {
        visitor.visitFixedSizeType = function visitFixedSizeType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return fixedSizeTypeNode(type, node.size);
        };
    }

    if (castedNodeKeys.includes('sizePrefixTypeNode')) {
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

    if (castedNodeKeys.includes('preOffsetTypeNode')) {
        visitor.visitPreOffsetType = function visitPreOffsetType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return preOffsetTypeNode(type, node.offset, node.strategy);
        };
    }

    if (castedNodeKeys.includes('postOffsetTypeNode')) {
        visitor.visitPostOffsetType = function visitPostOffsetType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            return postOffsetTypeNode(type, node.offset, node.strategy);
        };
    }

    if (castedNodeKeys.includes('sentinelTypeNode')) {
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

    if (castedNodeKeys.includes('hiddenPrefixTypeNode')) {
        visitor.visitHiddenPrefixType = function visitHiddenPrefixType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const prefix = node.prefix.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode'));
            if (prefix.length === 0) return type;
            return hiddenPrefixTypeNode(type, prefix);
        };
    }

    if (castedNodeKeys.includes('hiddenSuffixTypeNode')) {
        visitor.visitHiddenSuffixType = function visitHiddenSuffixType(node) {
            const type = visit(this)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const suffix = node.suffix.map(visit(this)).filter(removeNullAndAssertIsNodeFilter('constantValueNode'));
            if (suffix.length === 0) return type;
            return hiddenSuffixTypeNode(type, suffix);
        };
    }

    if (castedNodeKeys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            const constant = visit(this)(node.constant);
            if (constant === null) return null;
            assertIsNode(constant, 'constantValueNode');
            return constantDiscriminatorNode(constant, node.offset);
        };
    }

    return visitor as Visitor<Node, TNodeKind>;
}
