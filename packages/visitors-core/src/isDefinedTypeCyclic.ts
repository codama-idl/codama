import { DefinedTypeNode } from '@codama/nodes';

import { getDefinedTypeLinksVisitor } from './getDefinedTypeLinksVisitor';
import { LinkableDictionary } from './LinkableDictionary';
import { assertNodePathHasProgram, getLastNodeFromPath, NodePath } from './NodePath';
import { NodeStack } from './NodeStack';

/**
 * Whether the defined type at the given path links back to itself, directly
 * or through other defined types, following the recorded links (see
 * `getDefinedTypeLinksVisitor`).
 *
 * The path must contain the program defining the type, since links are
 * resolved from it; otherwise, `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` is thrown.
 *
 * @example
 * ```ts
 * // node = struct { value: u8, next: option<link(node)> }
 * isDefinedTypeCyclic([root, program, node], linkables); // true
 * ```
 */
export function isDefinedTypeCyclic(path: NodePath<DefinedTypeNode>, linkables: LinkableDictionary): boolean {
    assertNodePathHasProgram(path);
    const target = getLastNodeFromPath(path);
    const stack = new NodeStack();
    const linksVisitor = getDefinedTypeLinksVisitor(linkables, { stack });
    const followed = new Set<DefinedTypeNode>();
    const pending = [path];
    while (pending.length > 0) {
        for (const linkedPath of stack.visitPath(pending.pop()!, linksVisitor)) {
            const linkedType = getLastNodeFromPath(linkedPath);
            if (linkedType === target) return true;
            if (followed.has(linkedType)) continue;
            followed.add(linkedType);
            pending.push(linkedPath);
        }
    }
    return false;
}
