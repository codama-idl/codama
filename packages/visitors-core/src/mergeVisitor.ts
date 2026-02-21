import { getAllPrograms, Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { staticVisitor } from './staticVisitor';
import { visit as baseVisit, Visitor } from './visitor';

export function mergeVisitor<TReturn, TNodeKind extends NodeKind = NodeKind>(
    leafValue: (node: Node) => TReturn,
    merge: (node: Node, values: TReturn[]) => TReturn,
    options: { keys?: TNodeKind[] } = {},
): Visitor<TReturn, TNodeKind> {
    const keys: NodeKind[] = options.keys ?? REGISTERED_NODE_KINDS;
    const visitor = staticVisitor(leafValue, { keys }) as Visitor<TReturn>;
    const visit =
        (v: Visitor<TReturn>) =>
        (node: Node): TReturn[] =>
            keys.includes(node.kind) ? [baseVisit(node, v)] : [];

    if (keys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            return merge(node, getAllPrograms(node).flatMap(visit(this)));
        };
    }

    if (keys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            return merge(node, [
                ...node.pdas.flatMap(visit(this)),
                ...node.accounts.flatMap(visit(this)),
                ...node.instructions.flatMap(visit(this)),
                ...node.definedTypes.flatMap(visit(this)),
                ...node.errors.flatMap(visit(this)),
                ...node.constants.flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            return merge(node, node.seeds.flatMap(visit(this)));
        };
    }

    if (keys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            return merge(node, [
                ...visit(this)(node.data),
                ...(node.pda ? visit(this)(node.pda) : []),
                ...(node.discriminators ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            return merge(node, [
                ...(node.status ? visit(this)(node.status) : []),
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

    if (keys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            return merge(node, [...(node.defaultValue ? visit(this)(node.defaultValue) : [])]);
        };
    }

    if (keys.includes('instructionArgumentNode')) {
        visitor.visitInstructionArgument = function visitInstructionArgument(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
            ]);
        };
    }

    if (keys.includes('instructionRemainingAccountsNode')) {
        visitor.visitInstructionRemainingAccounts = function visitInstructionRemainingAccounts(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (keys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (keys.includes('instructionStatusNode')) {
        visitor.visitInstructionStatus = function visitInstructionStatus(node) {
            return merge(node, []);
        };
    }

    if (keys.includes('constantNode')) {
        visitor.visitConstant = function visitConstant(node) {
            return merge(node, [...visit(this)(node.type), ...visit(this)(node.value)]);
        };
    }

    if (keys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (keys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.item)]);
        };
    }

    if (keys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            return merge(node, [...visit(this)(node.size), ...node.variants.flatMap(visit(this))]);
        };
    }

    if (keys.includes('enumStructVariantTypeNode')) {
        visitor.visitEnumStructVariantType = function visitEnumStructVariantType(node) {
            return merge(node, visit(this)(node.struct));
        };
    }

    if (keys.includes('enumTupleVariantTypeNode')) {
        visitor.visitEnumTupleVariantType = function visitEnumTupleVariantType(node) {
            return merge(node, visit(this)(node.tuple));
        };
    }

    if (keys.includes('mapTypeNode')) {
        visitor.visitMapType = function visitMapType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.key), ...visit(this)(node.value)]);
        };
    }

    if (keys.includes('optionTypeNode')) {
        visitor.visitOptionType = function visitOptionType(node) {
            return merge(node, [...visit(this)(node.prefix), ...visit(this)(node.item)]);
        };
    }

    if (keys.includes('zeroableOptionTypeNode')) {
        visitor.visitZeroableOptionType = function visitZeroableOptionType(node) {
            return merge(node, [...visit(this)(node.item), ...(node.zeroValue ? visit(this)(node.zeroValue) : [])]);
        };
    }

    if (keys.includes('remainderOptionTypeNode')) {
        visitor.visitRemainderOptionType = function visitRemainderOptionType(node) {
            return merge(node, visit(this)(node.item));
        };
    }

    if (keys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            return merge(node, visit(this)(node.size));
        };
    }

    if (keys.includes('setTypeNode')) {
        visitor.visitSetType = function visitSetType(node) {
            return merge(node, [...visit(this)(node.count), ...visit(this)(node.item)]);
        };
    }

    if (keys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            return merge(node, node.fields.flatMap(visit(this)));
        };
    }

    if (keys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
            ]);
        };
    }

    if (keys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (keys.includes('amountTypeNode')) {
        visitor.visitAmountType = function visitAmountType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (keys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (keys.includes('solAmountTypeNode')) {
        visitor.visitSolAmountType = function visitSolAmountType(node) {
            return merge(node, visit(this)(node.number));
        };
    }

    if (keys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            return merge(node, visit(this)(node.prefix));
        };
    }

    if (keys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (keys.includes('constantValueNode')) {
        visitor.visitConstantValue = function visitConstantValue(node) {
            return merge(node, [...visit(this)(node.type), ...visit(this)(node.value)]);
        };
    }

    if (keys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            return merge(node, [...visit(this)(node.enum), ...(node.value ? visit(this)(node.value) : [])]);
        };
    }

    if (keys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return merge(node, node.entries.flatMap(visit(this)));
        };
    }

    if (keys.includes('mapEntryValueNode')) {
        visitor.visitMapEntryValue = function visitMapEntryValue(node) {
            return merge(node, [...visit(this)(node.key), ...visit(this)(node.value)]);
        };
    }

    if (keys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (keys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (keys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return merge(node, node.fields.flatMap(visit(this)));
        };
    }

    if (keys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (keys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return merge(node, node.items.flatMap(visit(this)));
        };
    }

    if (keys.includes('constantPdaSeedNode')) {
        visitor.visitConstantPdaSeed = function visitConstantPdaSeed(node) {
            return merge(node, [...visit(this)(node.type), ...visit(this)(node.value)]);
        };
    }

    if (keys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (keys.includes('resolverValueNode')) {
        visitor.visitResolverValue = function visitResolverValue(node) {
            return merge(node, (node.dependsOn ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            return merge(node, [
                ...visit(this)(node.condition),
                ...(node.value ? visit(this)(node.value) : []),
                ...(node.ifTrue ? visit(this)(node.ifTrue) : []),
                ...(node.ifFalse ? visit(this)(node.ifFalse) : []),
            ]);
        };
    }

    if (keys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            return merge(node, [...visit(this)(node.pda), ...node.seeds.flatMap(visit(this))]);
        };
    }

    if (keys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            return merge(node, visit(this)(node.value));
        };
    }

    if (keys.includes('fixedSizeTypeNode')) {
        visitor.visitFixedSizeType = function visitFixedSizeType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (keys.includes('sizePrefixTypeNode')) {
        visitor.visitSizePrefixType = function visitSizePrefixType(node) {
            return merge(node, [...visit(this)(node.prefix), ...visit(this)(node.type)]);
        };
    }

    if (keys.includes('preOffsetTypeNode')) {
        visitor.visitPreOffsetType = function visitPreOffsetType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (keys.includes('postOffsetTypeNode')) {
        visitor.visitPostOffsetType = function visitPostOffsetType(node) {
            return merge(node, visit(this)(node.type));
        };
    }

    if (keys.includes('sentinelTypeNode')) {
        visitor.visitSentinelType = function visitSentinelType(node) {
            return merge(node, [...visit(this)(node.sentinel), ...visit(this)(node.type)]);
        };
    }

    if (keys.includes('hiddenPrefixTypeNode')) {
        visitor.visitHiddenPrefixType = function visitHiddenPrefixType(node) {
            return merge(node, [...node.prefix.flatMap(visit(this)), ...visit(this)(node.type)]);
        };
    }

    if (keys.includes('hiddenSuffixTypeNode')) {
        visitor.visitHiddenSuffixType = function visitHiddenSuffixType(node) {
            return merge(node, [...visit(this)(node.type), ...node.suffix.flatMap(visit(this))]);
        };
    }

    if (keys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            return merge(node, visit(this)(node.constant));
        };
    }

    if (keys.includes('accountLinkNode')) {
        visitor.visitAccountLink = function visitAccountLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (keys.includes('definedTypeLinkNode')) {
        visitor.visitDefinedTypeLink = function visitDefinedTypeLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (keys.includes('instructionLinkNode')) {
        visitor.visitInstructionLink = function visitInstructionLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    if (keys.includes('instructionAccountLinkNode')) {
        visitor.visitInstructionAccountLink = function visitInstructionAccountLink(node) {
            return merge(node, node.instruction ? visit(this)(node.instruction) : []);
        };
    }

    if (keys.includes('instructionArgumentLinkNode')) {
        visitor.visitInstructionArgumentLink = function visitInstructionArgumentLink(node) {
            return merge(node, node.instruction ? visit(this)(node.instruction) : []);
        };
    }

    if (keys.includes('pdaLinkNode')) {
        visitor.visitPdaLink = function visitPdaLink(node) {
            return merge(node, node.program ? visit(this)(node.program) : []);
        };
    }

    return visitor as Visitor<TReturn, TNodeKind>;
}
