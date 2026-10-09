import { DefinedTypeNode } from '@codama/nodes';

import { getHasFiniteValueVisitor } from './getHasFiniteValueVisitor';
import { LinkableDictionary } from './LinkableDictionary';
import { assertNodePathHasProgram, NodePath } from './NodePath';
import { NodeStack } from './NodeStack';

/**
 * Whether the defined type at the given path has at least one finite value,
 * following the recorded links (see `getHasFiniteValueVisitor`). Types lack
 * one when they are cyclic without a way out, e.g. `a = link(a)` or
 * `node = struct { next: link(node) }`, or when they contain an enum without
 * variants.
 *
 * The path must contain the program defining the type, since links are
 * resolved from it; otherwise, `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` is thrown.
 *
 * @example
 * ```ts
 * // list = struct { next: option<link(list)> }, loop = struct { next: link(loop) }
 * hasDefinedTypeFiniteValue([root, program, list], linkables); // true
 * hasDefinedTypeFiniteValue([root, program, loop], linkables); // false
 * ```
 */
export function hasDefinedTypeFiniteValue(path: NodePath<DefinedTypeNode>, linkables: LinkableDictionary): boolean {
    assertNodePathHasProgram(path);
    const stack = new NodeStack();
    return stack.visitPath(path, getHasFiniteValueVisitor(linkables, { stack }));
}
