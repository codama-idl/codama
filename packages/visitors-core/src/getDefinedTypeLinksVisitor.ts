import { DefinedTypeNode } from '@codama/nodes';

import { extendVisitor } from './extendVisitor';
import { mergeVisitor } from './generated/mergeVisitor';
import type { LinkableDictionary } from './LinkableDictionary';
import { NodePath } from './NodePath';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { visit, Visitor } from './visitor';

/**
 * List the paths of the defined types the visited node links to, without
 * following these links. Links that cannot be resolved are skipped.
 *
 * Only links shaping a type are listed: the defined type of an
 * `enumValueNode` merely references it, so it is left out.
 *
 * Links are resolved from the closest program of the current path, so visit
 * nodes with their full path, e.g. using `stack.visitPath(path, visitor)` with
 * the visitor's own stack. Links visited without a program are not resolved.
 *
 * @example
 * ```ts
 * // node = struct { value: link(amount), next: option<link(node)> }
 * stack.visitPath([root, program, node], getDefinedTypeLinksVisitor(linkables, { stack }));
 * // [[root, program, amount], [root, program, node]]
 * ```
 */
export function getDefinedTypeLinksVisitor(
    linkables: LinkableDictionary,
    options: { stack?: NodeStack } = {},
): Visitor<NodePath<DefinedTypeNode>[]> {
    const stack = options.stack ?? new NodeStack();

    return pipe(
        mergeVisitor(
            () => [] as NodePath<DefinedTypeNode>[],
            (_, values) => values.flat(),
        ),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(node, { next }) {
                    const linkedPath = linkables.getPath(stack.getPath(node.kind));
                    return [...(linkedPath ? [linkedPath] : []), ...next(node)];
                },
                visitEnumValue(node, { self }) {
                    return node.value ? visit(node.value, self) : [];
                },
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}
