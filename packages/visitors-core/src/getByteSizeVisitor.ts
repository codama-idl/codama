import { CountNode, isNode, isScalarEnum, REGISTERED_TYPE_NODE_KINDS, RegisteredTypeNode } from '@codama/nodes';

import { extendVisitor } from './extendVisitor';
import { LinkableDictionary } from './LinkableDictionary';
import { mergeVisitor } from './mergeVisitor';
import { getLastNodeFromPath } from './NodePath';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { visit, Visitor } from './visitor';

export type ByteSizeVisitorKeys =
    | RegisteredTypeNode['kind']
    | 'accountNode'
    | 'constantValueNode'
    | 'definedTypeLinkNode'
    | 'definedTypeNode'
    | 'instructionArgumentNode'
    | 'instructionNode';

export function getByteSizeVisitor(
    linkables: LinkableDictionary,
    options: { stack?: NodeStack } = {},
): Visitor<number | null, ByteSizeVisitorKeys> {
    const stack = options.stack ?? new NodeStack();

    const visitedDefinedTypes = new Map<string, number | null>();
    const definedTypeStack: string[] = [];

    const sumSizes = (values: (number | null)[]): number | null =>
        values.reduce((all, one) => (all === null || one === null ? null : all + one), 0 as number | null);

    const baseVisitor = mergeVisitor(
        () => null as number | null,
        (_, values) => sumSizes(values),
        {
            keys: [
                ...REGISTERED_TYPE_NODE_KINDS,
                'accountNode',
                'constantValueNode',
                'definedTypeLinkNode',
                'definedTypeNode',
                'instructionArgumentNode',
                'instructionNode',
            ],
        },
    );

    return pipe(
        baseVisitor,
        v =>
            extendVisitor(v, {
                visitAccount(node, { self }) {
                    return visit(node.data, self);
                },

                visitArrayType(node, { self }) {
                    return getArrayLikeSize(node.count, visit(node.item, self), self);
                },

                visitConstantValue(node, { self }) {
                    const typeSize = visit(node.type, self);
                    if (typeSize !== null) return typeSize;
                    if (isNode(node.value, 'bytesValueNode') && node.value.encoding === 'base16') {
                        return Math.ceil(node.value.data.length / 2);
                    }
                    if (
                        isNode(node.type, 'stringTypeNode') &&
                        node.type.encoding === 'base16' &&
                        isNode(node.value, 'stringValueNode')
                    ) {
                        return Math.ceil(node.value.string.length / 2);
                    }
                    // Technically, we could still identify other fixed-size constants
                    // but we'd need to import @solana/codecs to compute them.
                    return null;
                },

                visitDefinedType(node, { self }) {
                    if (visitedDefinedTypes.has(node.name)) {
                        return visitedDefinedTypes.get(node.name)!;
                    }
                    definedTypeStack.push(node.name);
                    const child = visit(node.type, self);
                    definedTypeStack.pop();
                    visitedDefinedTypes.set(node.name, child);
                    return child;
                },

                visitDefinedTypeLink(node, { self }) {
                    // Fetch the linked type and return null if not found.
                    // The validator visitor will throw a proper error later on.
                    const linkedDefinedPath = linkables.getPath(stack.getPath(node.kind));
                    if (!linkedDefinedPath) return null;
                    const linkedDefinedType = getLastNodeFromPath(linkedDefinedPath);

                    // This prevents infinite recursion by using assuming
                    // cyclic types don't have a fixed size.
                    if (definedTypeStack.includes(linkedDefinedType.name)) {
                        return null;
                    }

                    stack.pushPath(linkedDefinedPath);
                    const result = visit(linkedDefinedType, self);
                    stack.popPath();
                    return result;
                },

                visitEnumEmptyVariantType() {
                    return 0;
                },

                visitEnumType(node, { self }) {
                    const prefix = visit(node.size, self) ?? 1;
                    if (isScalarEnum(node)) return prefix;
                    const variantSizes = node.variants.map(v => visit(v, self));
                    const allVariantHaveTheSameFixedSize = variantSizes.every((one, _, all) => one === all[0]);
                    return allVariantHaveTheSameFixedSize && variantSizes.length > 0 && variantSizes[0] !== null
                        ? variantSizes[0] + prefix
                        : null;
                },

                visitFixedSizeType(node) {
                    return node.size;
                },

                visitInstruction(node, { self }) {
                    return sumSizes(node.arguments.map(arg => visit(arg, self)));
                },

                visitInstructionArgument(node, { self }) {
                    return visit(node.type, self);
                },

                visitMapType(node, { self }) {
                    const innerSize = sumSizes([visit(node.key, self), visit(node.value, self)]);
                    return getArrayLikeSize(node.count, innerSize, self);
                },

                visitNumberType(node) {
                    if (node.format === 'shortU16') return null;
                    return parseInt(node.format.slice(1), 10) / 8;
                },

                visitOptionType(node, { self }) {
                    if (!node.fixed) return null;
                    return sumSizes([visit(node.prefix, self), visit(node.item, self)]);
                },

                visitPostOffsetType(node, { self }) {
                    const typeSize = visit(node.type, self);
                    return node.strategy === 'padded' ? sumSizes([typeSize, node.offset]) : typeSize;
                },

                visitPreOffsetType(node, { self }) {
                    const typeSize = visit(node.type, self);
                    return node.strategy === 'padded' ? sumSizes([typeSize, node.offset]) : typeSize;
                },

                visitPublicKeyType() {
                    return 32;
                },

                visitRemainderOptionType(node, { self }) {
                    const itemSize = visit(node.item, self);
                    return itemSize === 0 ? 0 : null;
                },

                visitSetType(node, { self }) {
                    return getArrayLikeSize(node.count, visit(node.item, self), self);
                },

                visitZeroableOptionType(node, { self }) {
                    const itemSize = visit(node.item, self);
                    if (!node.zeroValue) return itemSize;
                    const zeroSize = visit(node.zeroValue, self);
                    return zeroSize === itemSize ? itemSize : null;
                },
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}

function getArrayLikeSize(
    count: CountNode,
    innerSize: number | null,
    self: Visitor<number | null, ByteSizeVisitorKeys>,
): number | null {
    if (innerSize === 0 && isNode(count, 'prefixedCountNode')) return visit(count.prefix, self);
    if (innerSize === 0) return 0;
    if (!isNode(count, 'fixedCountNode')) return null;
    if (count.value === 0) return 0;
    return innerSize !== null ? innerSize * count.value : null;
}
