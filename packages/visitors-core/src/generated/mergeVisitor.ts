import { REGISTERED_NODE_KINDS, type Node, type NodeKind } from '@codama/nodes';

import { staticVisitor } from '../staticVisitor';
import { type Visitor, visit as baseVisit } from '../visitor';

/**
 * Merge visitor: traverses the tree collecting per-node values into
 * a single result via a user-supplied `merge` function. Leaf nodes
 * (or nodes outside `keys`) yield `leafValue(node)`; every other
 * visited node's value is `merge(node, [<visited children's values>])`.
 */
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

    if (keys.includes('arrayTypeNode')) {
        visitor.visitArrayType = function visitArrayType(node) {
            return merge(node, [
                ...visit(this)(node.count),
                ...visit(this)(node.item),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('booleanTypeNode')) {
        visitor.visitBooleanType = function visitBooleanType(node) {
            return merge(node, [
                ...visit(this)(node.size),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('bytesTypeNode')) {
        visitor.visitBytesType = function visitBytesType(node) {
            return merge(node, [
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('dateTimeTypeNode')) {
        visitor.visitDateTimeType = function visitDateTimeType(node) {
            return merge(node, [
                ...visit(this)(node.number),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('durationTypeNode')) {
        visitor.visitDurationType = function visitDurationType(node) {
            return merge(node, [
                ...visit(this)(node.number),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('enumTypeNode')) {
        visitor.visitEnumType = function visitEnumType(node) {
            return merge(node, [
                ...visit(this)(node.size),
                ...(node.variants ?? []).flatMap(visit(this)),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('enumVariantTypeNode')) {
        visitor.visitEnumVariantType = function visitEnumVariantType(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.data ? visit(this)(node.data) : []),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('fixedPointTypeNode')) {
        visitor.visitFixedPointType = function visitFixedPointType(node) {
            return merge(node, [
                ...visit(this)(node.number),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('floatTypeNode')) {
        visitor.visitFloatType = function visitFloatType(node) {
            return merge(node, [
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('integerTypeNode')) {
        visitor.visitIntegerType = function visitIntegerType(node) {
            return merge(node, [
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('mapTypeNode')) {
        visitor.visitMapType = function visitMapType(node) {
            return merge(node, [
                ...visit(this)(node.count),
                ...visit(this)(node.key),
                ...visit(this)(node.value),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('optionTypeNode')) {
        visitor.visitOptionType = function visitOptionType(node) {
            return merge(node, [
                ...visit(this)(node.prefix),
                ...visit(this)(node.item),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('publicKeyTypeNode')) {
        visitor.visitPublicKeyType = function visitPublicKeyType(node) {
            return merge(node, [
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('remainderOptionTypeNode')) {
        visitor.visitRemainderOptionType = function visitRemainderOptionType(node) {
            return merge(node, [
                ...visit(this)(node.item),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('setTypeNode')) {
        visitor.visitSetType = function visitSetType(node) {
            return merge(node, [
                ...visit(this)(node.count),
                ...visit(this)(node.item),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('stringTypeNode')) {
        visitor.visitStringType = function visitStringType(node) {
            return merge(node, [
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('structFieldTypeNode')) {
        visitor.visitStructFieldType = function visitStructFieldType(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.type),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('structTypeNode')) {
        visitor.visitStructType = function visitStructType(node) {
            return merge(node, [
                ...(node.fields ?? []).flatMap(visit(this)),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('tupleTypeNode')) {
        visitor.visitTupleType = function visitTupleType(node) {
            return merge(node, [
                ...(node.items ?? []).flatMap(visit(this)),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('zeroableOptionTypeNode')) {
        visitor.visitZeroableOptionType = function visitZeroableOptionType(node) {
            return merge(node, [
                ...visit(this)(node.item),
                ...(node.zeroValue ? visit(this)(node.zeroValue) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('fixedSizeTransformNode')) {
        visitor.visitFixedSizeTransform = function visitFixedSizeTransform(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('hiddenPrefixTransformNode')) {
        visitor.visitHiddenPrefixTransform = function visitHiddenPrefixTransform(node) {
            return merge(node, [
                ...(node.prefix ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('hiddenSuffixTransformNode')) {
        visitor.visitHiddenSuffixTransform = function visitHiddenSuffixTransform(node) {
            return merge(node, [
                ...(node.suffix ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('postOffsetTransformNode')) {
        visitor.visitPostOffsetTransform = function visitPostOffsetTransform(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('preOffsetTransformNode')) {
        visitor.visitPreOffsetTransform = function visitPreOffsetTransform(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('sentinelTransformNode')) {
        visitor.visitSentinelTransform = function visitSentinelTransform(node) {
            return merge(node, [...visit(this)(node.sentinel), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('sizePrefixTransformNode')) {
        visitor.visitSizePrefixTransform = function visitSizePrefixTransform(node) {
            return merge(node, [...visit(this)(node.prefix), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('arrayValueNode')) {
        visitor.visitArrayValue = function visitArrayValue(node) {
            return merge(node, [
                ...(node.items ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('booleanValueNode')) {
        visitor.visitBooleanValue = function visitBooleanValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('bytesValueNode')) {
        visitor.visitBytesValue = function visitBytesValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('constantValueNode')) {
        visitor.visitConstantValue = function visitConstantValue(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...visit(this)(node.value),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('enumValueNode')) {
        visitor.visitEnumValue = function visitEnumValue(node) {
            return merge(node, [
                ...visit(this)(node.enum),
                ...(node.value ? visit(this)(node.value) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('floatValueNode')) {
        visitor.visitFloatValue = function visitFloatValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('injectedValueNode')) {
        visitor.visitInjectedValue = function visitInjectedValue(node) {
            return merge(node, [
                ...(node.fallback ? visit(this)(node.fallback) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('integerValueNode')) {
        visitor.visitIntegerValue = function visitIntegerValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('mapEntryValueNode')) {
        visitor.visitMapEntryValue = function visitMapEntryValue(node) {
            return merge(node, [
                ...visit(this)(node.key),
                ...visit(this)(node.value),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('mapValueNode')) {
        visitor.visitMapValue = function visitMapValue(node) {
            return merge(node, [
                ...(node.entries ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('noneValueNode')) {
        visitor.visitNoneValue = function visitNoneValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('publicKeyValueNode')) {
        visitor.visitPublicKeyValue = function visitPublicKeyValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('setValueNode')) {
        visitor.visitSetValue = function visitSetValue(node) {
            return merge(node, [
                ...(node.items ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('someValueNode')) {
        visitor.visitSomeValue = function visitSomeValue(node) {
            return merge(node, [...visit(this)(node.value), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('stringValueNode')) {
        visitor.visitStringValue = function visitStringValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('structFieldValueNode')) {
        visitor.visitStructFieldValue = function visitStructFieldValue(node) {
            return merge(node, [...visit(this)(node.value), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('structValueNode')) {
        visitor.visitStructValue = function visitStructValue(node) {
            return merge(node, [
                ...(node.fields ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('tupleValueNode')) {
        visitor.visitTupleValue = function visitTupleValue(node) {
            return merge(node, [
                ...(node.items ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('accountLinkNode')) {
        visitor.visitAccountLink = function visitAccountLink(node) {
            return merge(node, [
                ...(node.program ? visit(this)(node.program) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('definedTypeLinkNode')) {
        visitor.visitDefinedTypeLink = function visitDefinedTypeLink(node) {
            return merge(node, [
                ...(node.program ? visit(this)(node.program) : []),
                ...(node.transforms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionAccountLinkNode')) {
        visitor.visitInstructionAccountLink = function visitInstructionAccountLink(node) {
            return merge(node, [
                ...(node.instruction ? visit(this)(node.instruction) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionLinkNode')) {
        visitor.visitInstructionLink = function visitInstructionLink(node) {
            return merge(node, [
                ...(node.program ? visit(this)(node.program) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('pdaLinkNode')) {
        visitor.visitPdaLink = function visitPdaLink(node) {
            return merge(node, [
                ...(node.program ? visit(this)(node.program) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('programLinkNode')) {
        visitor.visitProgramLink = function visitProgramLink(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('constantPdaSeedNode')) {
        visitor.visitConstantPdaSeed = function visitConstantPdaSeed(node) {
            return merge(node, [
                ...visit(this)(node.type),
                ...visit(this)(node.value),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('variablePdaSeedNode')) {
        visitor.visitVariablePdaSeed = function visitVariablePdaSeed(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.type),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('fixedCountNode')) {
        visitor.visitFixedCount = function visitFixedCount(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('prefixedCountNode')) {
        visitor.visitPrefixedCount = function visitPrefixedCount(node) {
            return merge(node, [...visit(this)(node.prefix), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('remainderCountNode')) {
        visitor.visitRemainderCount = function visitRemainderCount(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('sentinelCountNode')) {
        visitor.visitSentinelCount = function visitSentinelCount(node) {
            return merge(node, [...visit(this)(node.sentinel), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('constantDiscriminatorNode')) {
        visitor.visitConstantDiscriminator = function visitConstantDiscriminator(node) {
            return merge(node, [...visit(this)(node.constant), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('fieldDiscriminatorNode')) {
        visitor.visitFieldDiscriminator = function visitFieldDiscriminator(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('sizeDiscriminatorNode')) {
        visitor.visitSizeDiscriminator = function visitSizeDiscriminator(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('amountNumberDisplayNode')) {
        visitor.visitAmountNumberDisplay = function visitAmountNumberDisplay(node) {
            return merge(node, [
                ...visit(this)(node.decimals),
                ...(node.unit ? visit(this)(node.unit) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('enumVariantDisplayNode')) {
        visitor.visitEnumVariantDisplay = function visitEnumVariantDisplay(node) {
            return merge(node, [
                ...(node.label !== undefined && typeof node.label !== 'string' ? visit(this)(node.label) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionAccountDisplayNode')) {
        visitor.visitInstructionAccountDisplay = function visitInstructionAccountDisplay(node) {
            return merge(node, [
                ...(node.label !== undefined && typeof node.label !== 'string' ? visit(this)(node.label) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionDisplayNode')) {
        visitor.visitInstructionDisplay = function visitInstructionDisplay(node) {
            return merge(node, [
                ...(node.intent !== undefined && typeof node.intent !== 'string' ? visit(this)(node.intent) : []),
                ...(node.interpolatedIntent !== undefined && typeof node.interpolatedIntent !== 'string'
                    ? visit(this)(node.interpolatedIntent)
                    : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('stringDisplayNode')) {
        visitor.visitStringDisplay = function visitStringDisplay(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('structFieldDisplayNode')) {
        visitor.visitStructFieldDisplay = function visitStructFieldDisplay(node) {
            return merge(node, [
                ...(node.label !== undefined && typeof node.label !== 'string' ? visit(this)(node.label) : []),
                ...(node.flattenPrefix !== undefined && typeof node.flattenPrefix !== 'string'
                    ? visit(this)(node.flattenPrefix)
                    : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('unitNumberDisplayNode')) {
        visitor.visitUnitNumberDisplay = function visitUnitNumberDisplay(node) {
            return merge(node, [...visit(this)(node.unit), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('accountBumpValueNode')) {
        visitor.visitAccountBumpValue = function visitAccountBumpValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('accountDataValueNode')) {
        visitor.visitAccountDataValue = function visitAccountDataValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('accountValueNode')) {
        visitor.visitAccountValue = function visitAccountValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('dataValueNode')) {
        visitor.visitDataValue = function visitDataValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('conditionalValueNode')) {
        visitor.visitConditionalValue = function visitConditionalValue(node) {
            return merge(node, [
                ...visit(this)(node.condition),
                ...(node.value ? visit(this)(node.value) : []),
                ...(node.ifTrue ? visit(this)(node.ifTrue) : []),
                ...(node.ifFalse ? visit(this)(node.ifFalse) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('identityValueNode')) {
        visitor.visitIdentityValue = function visitIdentityValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('payerValueNode')) {
        visitor.visitPayerValue = function visitPayerValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('pdaSeedValueNode')) {
        visitor.visitPdaSeedValue = function visitPdaSeedValue(node) {
            return merge(node, [...visit(this)(node.value), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('pdaValueNode')) {
        visitor.visitPdaValue = function visitPdaValue(node) {
            return merge(node, [
                ...visit(this)(node.pda),
                ...(node.seeds ?? []).flatMap(visit(this)),
                ...(node.programId ? visit(this)(node.programId) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('programIdValueNode')) {
        visitor.visitProgramIdValue = function visitProgramIdValue(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('accountNode')) {
        visitor.visitAccount = function visitAccount(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.data),
                ...(node.pda ? visit(this)(node.pda) : []),
                ...(node.discriminators ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('constantNode')) {
        visitor.visitConstant = function visitConstant(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.type),
                ...visit(this)(node.value),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('definedTypeNode')) {
        visitor.visitDefinedType = function visitDefinedType(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.type),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('errorNode')) {
        visitor.visitError = function visitError(node) {
            return merge(node, [
                ...(node.message !== undefined && typeof node.message !== 'string' ? visit(this)(node.message) : []),
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('eventNode')) {
        visitor.visitEvent = function visitEvent(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...visit(this)(node.data),
                ...(node.discriminators ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionAccountNode')) {
        visitor.visitInstructionAccount = function visitInstructionAccount(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.defaultValue ? visit(this)(node.defaultValue) : []),
                ...(node.accountLink ? visit(this)(node.accountLink) : []),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionByteDeltaNode')) {
        visitor.visitInstructionByteDelta = function visitInstructionByteDelta(node) {
            return merge(node, [...visit(this)(node.value), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('instructionNode')) {
        visitor.visitInstruction = function visitInstruction(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.status ? visit(this)(node.status) : []),
                ...(node.accounts ?? []).flatMap(visit(this)),
                ...(node.data ? visit(this)(node.data) : []),
                ...(node.remainingAccounts ?? []).flatMap(visit(this)),
                ...(node.byteDeltas ?? []).flatMap(visit(this)),
                ...(node.discriminators ?? []).flatMap(visit(this)),
                ...(node.subInstructions ?? []).flatMap(visit(this)),
                ...(node.provides ?? []).flatMap(visit(this)),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionRemainingAccountsNode')) {
        visitor.visitInstructionRemainingAccounts = function visitInstructionRemainingAccounts(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.display ? visit(this)(node.display) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('instructionStatusNode')) {
        visitor.visitInstructionStatus = function visitInstructionStatus(node) {
            return merge(node, [
                ...(node.message !== undefined && typeof node.message !== 'string' ? visit(this)(node.message) : []),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('pdaNode')) {
        visitor.visitPda = function visitPda(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.seeds ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('pluginNode')) {
        visitor.visitPlugin = function visitPlugin(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    if (keys.includes('programNode')) {
        visitor.visitProgram = function visitProgram(node) {
            return merge(node, [
                ...(node.docs !== undefined && typeof node.docs !== 'string' ? visit(this)(node.docs) : []),
                ...(node.pdas ?? []).flatMap(visit(this)),
                ...(node.accounts ?? []).flatMap(visit(this)),
                ...(node.events ?? []).flatMap(visit(this)),
                ...(node.instructions ?? []).flatMap(visit(this)),
                ...(node.definedTypes ?? []).flatMap(visit(this)),
                ...(node.errors ?? []).flatMap(visit(this)),
                ...(node.constants ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('providedNode')) {
        visitor.visitProvided = function visitProvided(node) {
            return merge(node, [...visit(this)(node.node), ...(node.plugins ?? []).flatMap(visit(this))]);
        };
    }

    if (keys.includes('rootNode')) {
        visitor.visitRoot = function visitRoot(node) {
            return merge(node, [
                ...visit(this)(node.program),
                ...(node.additionalPrograms ?? []).flatMap(visit(this)),
                ...(node.plugins ?? []).flatMap(visit(this)),
            ]);
        };
    }

    if (keys.includes('textNode')) {
        visitor.visitText = function visitText(node) {
            return merge(node, (node.plugins ?? []).flatMap(visit(this)));
        };
    }

    return visitor as Visitor<TReturn, TNodeKind>;
}
