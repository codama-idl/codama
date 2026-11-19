import { CountNode, DefinedTypeNode, isNode, Node } from '@codama/nodes';

import { extendVisitor } from './extendVisitor';
import { mergeVisitor } from './generated/mergeVisitor';
import type { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath } from './NodePath';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { visit, Visitor } from './visitor';

/**
 * Whether the visited type has at least one finite value, following links.
 *
 * Options may be `None`, enums may pick any variant and collections without a
 * fixed positive count may be empty, so all of them stop a recursion at their
 * items. The other parts of a type, such as its transforms, counts, prefixes,
 * sizes and zero values, are part of every value of it, so they prevent a
 * value from existing when their constants link back to a type being visited,
 * since those constants could then never be created. Links that cannot be
 * resolved count as finite.
 *
 * A link back to a defined type being visited has no finite value on its own:
 * a finite value never needs to nest a type within itself, so another branch
 * must provide one. Enums without variants have no value at all.
 *
 * Links are resolved from the closest program of the current path, so visit
 * nodes with their full path, e.g. using `stack.visitPath(path, visitor)` with
 * the visitor's own stack. Links visited without a program are not resolved.
 *
 * @example
 * ```ts
 * // list = struct { next: option<link(list)> }, loop = struct { next: link(loop) }
 * stack.visitPath([root, program, list], getHasFiniteValueVisitor(linkables, { stack })); // true
 * stack.visitPath([root, program, loop], getHasFiniteValueVisitor(linkables, { stack })); // false
 * ```
 */
export function getHasFiniteValueVisitor(
    linkables: LinkableDictionary,
    options: { stack?: NodeStack } = {},
): Visitor<boolean> {
    const stack = options.stack ?? new NodeStack();
    const visitingDefinedTypes = new Set<DefinedTypeNode>();
    // Only `true` is cached: a `false` may only hold because of the defined types being
    // visited, whereas a `true` holds whichever are, so it never needs computing again.
    const finiteDefinedTypes = new Set<DefinedTypeNode>();

    return pipe(
        mergeVisitor(
            () => true,
            (_, values) => values.every(Boolean),
        ),
        v =>
            extendVisitor(v, {
                visitArrayType(node, { self }) {
                    return (
                        (!hasFixedPositiveCount(node.count) || visit(node.item, self)) &&
                        visit(node.count, self) &&
                        visitAll(node.transforms, self)
                    );
                },

                visitDefinedType(node, { next }) {
                    if (finiteDefinedTypes.has(node)) return true;
                    visitingDefinedTypes.add(node);
                    const hasFiniteValue = next(node);
                    visitingDefinedTypes.delete(node);
                    if (hasFiniteValue) finiteDefinedTypes.add(node);
                    return hasFiniteValue;
                },

                // The link itself, such as its transforms, goes through `next`.
                visitDefinedTypeLink(node, { next, self }) {
                    const linkedPath = linkables.getPath(stack.getPath(node.kind));
                    if (!linkedPath) return next(node);
                    if (visitingDefinedTypes.has(getLastNodeFromPath(linkedPath))) return false;
                    return stack.visitPath(linkedPath, self) && next(node);
                },

                visitEnumType(node, { self }) {
                    return (
                        (node.variants ?? []).some(variant => visit(variant, self)) &&
                        visit(node.size, self) &&
                        visitAll(node.transforms, self)
                    );
                },

                // The defined type of an enum value only references it.
                visitEnumValue() {
                    return true;
                },

                visitMapType(node, { self }) {
                    return (
                        (!hasFixedPositiveCount(node.count) || (visit(node.key, self) && visit(node.value, self))) &&
                        visit(node.count, self) &&
                        visitAll(node.transforms, self)
                    );
                },

                visitOptionType(node, { self }) {
                    return visit(node.prefix, self) && visitAll(node.transforms, self);
                },

                visitRemainderOptionType(node, { self }) {
                    return visitAll(node.transforms, self);
                },

                visitSetType(node, { self }) {
                    return (
                        (!hasFixedPositiveCount(node.count) || visit(node.item, self)) &&
                        visit(node.count, self) &&
                        visitAll(node.transforms, self)
                    );
                },

                visitZeroableOptionType(node, { self }) {
                    return (!node.zeroValue || visit(node.zeroValue, self)) && visitAll(node.transforms, self);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}

// The transforms of a type are part of every value of it, even when the recursion may stop at its item.
function visitAll(nodes: readonly Node[] | undefined, visitor: Visitor<boolean>): boolean {
    return (nodes ?? []).every(node => visit(node, visitor));
}

function hasFixedPositiveCount(count: CountNode): boolean {
    return isNode(count, 'fixedCountNode') && count.value > 0;
}
