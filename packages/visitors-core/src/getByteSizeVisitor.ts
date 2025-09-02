import { isNode, isScalarEnum, REGISTERED_TYPE_NODE_KINDS, RegisteredTypeNode } from '@codama/nodes';

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
                'definedTypeLinkNode',
                'definedTypeNode',
                'accountNode',
                'instructionNode',
                'instructionArgumentNode',
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
                    if (!isNode(node.count, 'fixedCountNode')) return null;
                    const count = node.count.value;
                    if (count === 0) return 0;
                    const itemSize = visit(node.item, self);
                    return itemSize !== null ? itemSize * count : null;
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
                    if (!isNode(node.count, 'fixedCountNode')) return null;
                    const count = node.count.value;
                    if (count === 0) return 0;
                    const keySize = visit(node.key, self);
                    const valueSize = visit(node.value, self);
                    return keySize !== null && valueSize !== null ? (keySize + valueSize) * count : null;
                },

                visitNumberType(node) {
                    if (node.format === 'shortU16') return null;
                    return parseInt(node.format.slice(1), 10) / 8;
                },

                visitOptionType(node, { self }) {
                    if (!node.fixed) return null;
                    const prefixSize = visit(node.prefix, self) as number;
                    const itemSize = visit(node.item, self);
                    return itemSize !== null ? itemSize + prefixSize : null;
                },

                visitPublicKeyType() {
                    return 32;
                },

                visitRemainderOptionType(node, { self }) {
                    const itemSize = visit(node.item, self);
                    return itemSize === 0 ? 0 : null;
                },

                visitSetType(node, { self }) {
                    if (!isNode(node.count, 'fixedCountNode')) return null;
                    const count = node.count.value;
                    if (count === 0) return 0;
                    const itemSize = visit(node.item, self);
                    return itemSize !== null ? itemSize * count : null;
                },
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}
