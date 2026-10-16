import type { Node } from '@codama/node-types';

/**
 * Render a path of nodes as a string, in the form of node selectors, e.g.
 * `[programNode]token.[accountNode]mint.[structTypeNode].[structFieldTypeNode]decimals`.
 *
 * Each node renders as its kind in brackets followed by its identifier, if it has one, and
 * nodes are separated by dots. A leading root node is left out, since every full path starts
 * with it, unless it is the only node of the path.
 *
 * @example
 * ```ts
 * getNodePathString([root, program, account]); // "[programNode]token.[accountNode]mint"
 * getNodePathString([root]); // "[rootNode]"
 * getNodePathString([]); // ""
 * ```
 */
export function getNodePathString(path: readonly Node[]): string {
    const nodes = path.length > 1 && path[0].kind === 'rootNode' ? path.slice(1) : path;
    return nodes.map(getNodeString).join('.');
}

function getNodeString(node: Node): string {
    const identifier = (node as { identifier?: unknown }).identifier;
    return typeof identifier === 'string' ? `[${node.kind}]${identifier}` : `[${node.kind}]`;
}

/**
 * Render the `path` of an error context, given as nodes or, for decoded production errors,
 * already rendered as a string. An empty path renders as `none`.
 */
export function formatContextPath(path: unknown): string {
    const rendered = Array.isArray(path) ? getNodePathString(path as Node[]) : String(path);
    return rendered === '' ? 'none' : rendered;
}
