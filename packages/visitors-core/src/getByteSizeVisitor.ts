import { CountNode, isNode, isScalarEnum, REGISTERED_TYPE_NODE_KINDS, RegisteredTypeNode } from '@codama/nodes';

import { applyByteSizeTransforms, nodeHasTransforms } from './applyByteSizeTransforms';
import { extendVisitor } from './extendVisitor';
import { mergeVisitor } from './generated/mergeVisitor';
import { interceptVisitor } from './interceptVisitor';
import { LinkableDictionary } from './LinkableDictionary';
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

                visitBytesType() {
                    return null;
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
                    if (visitedDefinedTypes.has(node.identifier)) {
                        return visitedDefinedTypes.get(node.identifier)!;
                    }
                    definedTypeStack.push(node.identifier);
                    const child = visit(node.type, self);
                    definedTypeStack.pop();
                    visitedDefinedTypes.set(node.identifier, child);
                    return child;
                },

                visitDefinedTypeLink(node, { self }) {
                    // Fetch the linked type and return null if not found.
                    const linkedDefinedPath = linkables.getPath(stack.getPath(node.kind));
                    if (!linkedDefinedPath) return null;
                    const linkedDefinedType = getLastNodeFromPath(linkedDefinedPath);

                    // This prevents infinite recursion by assuming cyclic types don't have a fixed size.
                    if (definedTypeStack.includes(linkedDefinedType.identifier)) return null;

                    stack.pushPath(linkedDefinedPath);
                    const result = visit(linkedDefinedType, self);
                    stack.popPath();
                    return result;
                },

                visitEnumType(node, { self }) {
                    const prefix = visit(node.size, self);
                    if (prefix === null) return null;
                    if (isScalarEnum(node)) return prefix;
                    const variantSizes = (node.variants ?? []).map(v => visit(v, self));
                    const allVariantHaveTheSameFixedSize = variantSizes.every((one, _, all) => one === all[0]);
                    return allVariantHaveTheSameFixedSize && variantSizes.length > 0 && variantSizes[0] !== null
                        ? variantSizes[0] + prefix
                        : null;
                },

                visitEnumVariantType(node, { self }) {
                    return node.data ? visit(node.data, self) : 0;
                },

                visitFloatType(node) {
                    return node.format === 'f32' ? 4 : 8;
                },

                visitInstruction(node, { self }) {
                    return node.data ? visit(node.data, self) : 0;
                },

                visitIntegerType(node) {
                    if (node.format === 'shortU16') return null;
                    return parseInt(node.format.slice(1), 10) / 8;
                },

                visitMapType(node, { self }) {
                    const innerSize = sumSizes([visit(node.key, self), visit(node.value, self)]);
                    return getArrayLikeSize(node.count, innerSize, self);
                },

                visitOptionType(node, { self }) {
                    if (!node.fixed) return null;
                    return sumSizes([visit(node.prefix, self), visit(node.item, self)]);
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

                visitStringType() {
                    return null;
                },

                visitZeroableOptionType(node, { self }) {
                    const itemSize = visit(node.item, self);
                    if (!node.zeroValue) return itemSize;
                    const zeroSize = visit(node.zeroValue, self);
                    return zeroSize === itemSize ? itemSize : null;
                },
            }),
        // Layer each type node's flat `transforms` on top of its own size.
        // The base merge visitor ignores transform children (their kinds
        // aren't in the visitor keys), so `next` yields the untransformed
        // size; `self` sizes the transforms' own children.
        v =>
            interceptVisitor(v, (node, next, self) => {
                if (!nodeHasTransforms(node) || (node.transforms ?? []).length === 0) {
                    return next(node);
                }
                return applyByteSizeTransforms(node, next(node), self);
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
