import { getAllPrograms, Node, NodeKind, REGISTERED_NODE_KINDS } from '@kinobi-so/nodes';

import { staticVisitor } from './staticVisitor';
import { visit as baseVisit, Visitor } from './visitor';

export function mergeVisitor<TReturn, TNodeKind extends NodeKind = NodeKind>(
    leafValue: (node: Node) => TReturn,
    merge: (node: Node, values: TReturn[]) => TReturn,
    nodeKeys: TNodeKind[] = REGISTERED_NODE_KINDS as TNodeKind[],
): Visitor<TReturn, TNodeKind> {
    const castedNodeKeys: NodeKind[] = nodeKeys;
    const visitor = staticVisitor(leafValue, castedNodeKeys) as Visitor<TReturn>;
    const visit =
        (v: Visitor<TReturn>) =>
        (node: Node): TReturn[] =>
            castedNodeKeys.includes(node.kind) ? [baseVisit(node, v)] : [];

    if (castedNodeKeys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            return merge(node, getAllPrograms(node).flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            return merge(node, [
                ...node.pdas.flatMap(visit(this)),
                ...node.accounts.flatMap(visit(this)),
                ...node.instructions.flatMap(visit(this)),
                ...node.definedTypes.flatMap(visit(this)),
                ...node.errors.flatMap(visit(this)),
            ]);
        };
    }

    if (castedNodeKeys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            return merge(node, node.seeds.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            return merge(node, [
                ...visit(this)(node.data),
                ...(node.pda ? visit(this)(node.pda) : []),
                ...(node.discriminators ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (castedNodeKeys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            return merge(node, [
                ...node.accounts.flatMap(visit(this)),
                ...node.arguments.flatMap(visit(this)),
                ...(node.extraArguments ?? []).flatMap(visit(this)),
                ...(node.remainingAccounts ?? []).flatMap(visit(this)),
                ...(node.byteDeltas ?? []).flatMap(visit(this)),
                ...(node.discriminators ?? []).flatMap(visit(this)),
                ...(node.subInstructions ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (castedNodeKeys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            return merge(node, [...(node.defaultValue ? visit(this)(node.defaultValue) : [])]);
        };
    }

    if (castedNodeKeys.includes('instructionArgumentNode')) {
        visitor.visitInstructionArgument = function visitInstructionArgument(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
            ]);
        };
    }

    if (castedNodeKeys.includes('instructionRemainingAccountsNode')) {
        visitor.visitInstructionRemainingAccounts = function visitInstructionRemainingAccounts(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (castedNodeKeys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (castedNodeKeys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (castedNodeKeys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.item)]);
        };
    }

    if (castedNodeKeys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            return merge(node, [...visit(this)(node.size), ...node.variants.flatMap(visit(this))]);
        };
    }

    if (castedNodeKeys.includes('enumStructVariantTypeNode')) {
        visitor.visitEnumStructVariantType = function visitEnumStructVariantType(node) {
            return merge(node, visit(this)(node.struct));
        };
    }

    if (castedNodeKeys.includes('enumTupleVariantTypeNode')) {
        visitor.visitEnumTupleVariantType = function visitEnumTupleVariantType(node) {
            return merge(node, visit(this)(node.tuple));
        };
    }

    if (castedNodeKeys.includes('mapTypeNode')) {
        visitor.visitMapType = function visitMapType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.key), ...visit(this)(node.value)]);
        };
    }

    if (castedNodeKeys.includes('optionTypeNode')) {
        visitor.visitOptionType = function visitOptionType(node) {
            return merge(node, [...visit(this)(node.prefix), ...visit(this)(node.item)]);
        };
    }

    if (castedNodeKeys.includes('zeroableOptionTypeNode')) {
        visitor.visitZeroableOptionType = function visitZeroableOptionType(node) {
            return merge(node, [...visit(this)(node.item), ...(node.zeroValue ? visit(this)(node.zeroValue) : [])]);
        };
    }

    if (castedNodeKeys.includes('remainderOptionTypeNode')) {
        visitor.visitRemainderOptionType = function visitRemainderOptionType(node) {
            return merge(node, visit(this)(node.item));
        };
    }

    if (castedNodeKeys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            return merge(node, visit(this)(node.size));
        };
    }

    if (castedNodeKeys.includes('setTypeNode')) {
        visitor.visitSetType = function visitSetType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.item)]);
        };
    }

    if (castedNodeKeys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            return merge(node, node.fields.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
            ]);
        };
    }

    if (castedNodeKeys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('amountTypeNode')) {
        visitor.visitAmountType = function visitAmountType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (castedNodeKeys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (castedNodeKeys.includes('solAmountTypeNode')) {
        visitor.visitSolAmountType = function visitSolAmountType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (castedNodeKeys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            return merge(node, visit(this)(node.prefix));
        };
    }

    if (castedNodeKeys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('constantValueNode')) {
        visitor.visitConstantValue = function visitConstantValue(node) {
            return merge(node, [...visit(this)(node.type), ...visit(this)(node.value)]);
        };
    }

    if (castedNodeKeys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            return merge(node, [...visit(this)(node.enum), ...(node.value ? visit(this)(node.value) : [])]);
        };
    }

    if (castedNodeKeys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return merge(node, node.entries.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('mapEntryValueNode')) {
        visitor.visitMapEntryValue = function visitMapEntryValue(node) {
            return merge(node, [...visit(this)(node.key), ...visit(this)(node.value)]);
        };
    }

    if (castedNodeKeys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (castedNodeKeys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return merge(node, node.fields.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (castedNodeKeys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('constantPdaSeedNode')) {
        visitor.visitConstantPdaSeed = function visitConstantPdaSeed(node) {
            return merge(node, [...visit(this)(node.type), ...visit(this)(node.value)]);
        };
    }

    if (castedNodeKeys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (castedNodeKeys.includes('resolverValueNode')) {
        visitor.visitResolverValue = function visitResolverValue(node) {
            return merge(node, (node.dependsOn ?? []).flatMap(visit(this)));
        };
    }

    if (castedNodeKeys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            return merge(node, [
                ...visit(this)(node.condition),
                ...(node.value ? visit(this)(node.value) : []),
                ...(node.ifTrue ? visit(this)(node.ifTrue) : []),
                ...(node.ifFalse ? visit(this)(node.ifFalse) : []),
            ]);
        };
    }

    if (castedNodeKeys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            return merge(node, [...visit(this)(node.pda), ...node.seeds.flatMap(visit(this))]);
        };
    }

    if (castedNodeKeys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (castedNodeKeys.includes('fixedSizeTypeNode')) {
        visitor.visitFixedSizeType = function visitFixedSizeType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (castedNodeKeys.includes('sizePrefixTypeNode')) {
        visitor.visitSizePrefixType = function visitSizePrefixType(node) {
            return merge(node, [...visit(this)(node.prefix), ...visit(this)(node.type)]);
        };
    }

    if (castedNodeKeys.includes('preOffsetTypeNode')) {
        visitor.visitPreOffsetType = function visitPreOffsetType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (castedNodeKeys.includes('postOffsetTypeNode')) {
        visitor.visitPostOffsetType = function visitPostOffsetType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (castedNodeKeys.includes('sentinelTypeNode')) {
        visitor.visitSentinelType = function visitSentinelType(node) {
            return merge(node, [...visit(this)(node.sentinel), ...visit(this)(node.type)]);
        };
    }

    if (castedNodeKeys.includes('hiddenPrefixTypeNode')) {
        visitor.visitHiddenPrefixType = function visitHiddenPrefixType(node) {
            return merge(node, [...node.prefix.flatMap(visit(this)), ...visit(this)(node.type)]);
        };
    }

    if (castedNodeKeys.includes('hiddenSuffixTypeNode')) {
        visitor.visitHiddenSuffixType = function visitHiddenSuffixType(node) {
            return merge(node, [...visit(this)(node.type), ...node.suffix.flatMap(visit(this))]);
        };
    }

    if (castedNodeKeys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            return merge(node, visit(this)(node.constant));
        };
    }

    if (castedNodeKeys.includes('accountLinkNode')) {
        visitor.visitAccountLink = function visitAccountLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (castedNodeKeys.includes('definedTypeLinkNode')) {
        visitor.visitDefinedTypeLink = function visitDefinedTypeLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (castedNodeKeys.includes('instructionLinkNode')) {
        visitor.visitInstructionLink = function visitInstructionLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (castedNodeKeys.includes('instructionAccountLinkNode')) {
        visitor.visitInstructionAccountLink = function visitInstructionAccountLink(node) {
            return merge(node, node.instruction ? visit(this)(node.instruction) : []);
        };
    }

    if (castedNodeKeys.includes('instructionArgumentLinkNode')) {
        visitor.visitInstructionArgumentLink = function visitInstructionArgumentLink(node) {
            return merge(node, node.instruction ? visit(this)(node.instruction) : []);
        };
    }

    if (castedNodeKeys.includes('pdaLinkNode')) {
        visitor.visitPdaLink = function visitPdaLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    return visitor as Visitor<TReturn, TNodeKind>;
}
