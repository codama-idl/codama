import type * as v1 from '../v1';

/**
 * The v1 nodes leading to a v1 node, from the root to that node included,
 * e.g. `[root, program, definedType, structType]`, as `NodePath` does for v2
 * nodes in `@codama/visitors-core`. Unlike `NodePath`, a path to a union of
 * nodes is a path ending at any member of that union, e.g. `V1NodePath<v1.TypeNode>`.
 *
 * Converters that may follow links receive the path of the node they convert,
 * and pass `[...path, child]` along when converting a child. The path tells
 * what the rest of the IDL holds, e.g. which program links without a
 * `program` point into.
 */
export type V1NodePath<TNode extends v1.Node | undefined = undefined> = [TNode] extends [undefined]
    ? readonly v1.Node[]
    : readonly [...(readonly v1.Node[]), TNode];

/** The node a v1 path leads to. */
export function getLastV1NodeFromPath<TNode extends v1.Node>(path: V1NodePath<TNode>): TNode {
    return path[path.length - 1] as TNode;
}

/** The root node of a v1 path, if the path starts at one. */
export function getV1RootFromPath(path: V1NodePath): v1.RootNode | undefined {
    const first = path[0];
    return first?.kind === 'rootNode' ? first : undefined;
}

/** The closest program node of a v1 path, i.e. the program defining the last node of the path. */
export function getV1ProgramFromPath(path: V1NodePath): v1.ProgramNode | undefined {
    for (let index = path.length - 1; index >= 0; index--) {
        const node = path[index];
        if (node.kind === 'programNode') return node;
    }
    return undefined;
}

/**
 * The path of the defined type a v1 link points to, given the path of that
 * link, e.g. `[root, program, definedType]`, if any. Links without a `program`
 * point into the closest program of their path; links with one point into the
 * program of that name in the root.
 */
export function getV1LinkedDefinedTypePath(
    linkPath: V1NodePath<v1.DefinedTypeLinkNode>,
): V1NodePath<v1.DefinedTypeNode> | undefined {
    const link = getLastV1NodeFromPath(linkPath);
    const root = getV1RootFromPath(linkPath);
    const program = link.program
        ? [root?.program, ...(root?.additionalPrograms ?? [])].find(candidate => candidate?.name === link.program?.name)
        : getV1ProgramFromPath(linkPath);
    const definedType = program?.definedTypes?.find(candidate => candidate.name === link.name);
    if (!program || !definedType) return undefined;
    return root ? [root, program, definedType] : [program, definedType];
}

/** v1 type nodes wrapping another type without changing its kind, e.g. `fixedSizeTypeNode`. */
export type V1WrapperTypeNode =
    | v1.FixedSizeTypeNode
    | v1.HiddenPrefixTypeNode
    | v1.HiddenSuffixTypeNode
    | v1.PostOffsetTypeNode
    | v1.PreOffsetTypeNode
    | v1.SentinelTypeNode
    | v1.SizePrefixTypeNode;

const WRAPPER_KINDS: readonly string[] = [
    'fixedSizeTypeNode',
    'hiddenPrefixTypeNode',
    'hiddenSuffixTypeNode',
    'postOffsetTypeNode',
    'preOffsetTypeNode',
    'sentinelTypeNode',
    'sizePrefixTypeNode',
] satisfies V1WrapperTypeNode['kind'][];

export function isV1WrapperTypeNode(node: v1.TypeNode): node is V1WrapperTypeNode {
    return WRAPPER_KINDS.includes(node.kind);
}

/**
 * Remove the wrappers of a v1 type, e.g. `fixedSizeTypeNode(stringTypeNode)`
 * gives `stringTypeNode`, together with the removed wrappers, outermost first.
 */
export function unwrapV1TypeNode<T extends v1.TypeNode>(
    node: v1.NestedTypeNode<T>,
): { type: T; wrappers: V1WrapperTypeNode[] } {
    const wrappers: V1WrapperTypeNode[] = [];
    let current: v1.TypeNode = node;
    while (isV1WrapperTypeNode(current)) {
        wrappers.push(current);
        current = current.type;
    }
    return { type: current as T, wrappers };
}

/**
 * Remove the wrappers at the end of a v1 type path, giving the path of the
 * wrapped type together with the path of each removed wrapper, outermost
 * first. See {@link unwrapV1TypeNode}.
 */
export function unwrapV1TypePath<T extends v1.TypeNode>(
    path: V1NodePath<v1.NestedTypeNode<T>>,
): { path: V1NodePath<T>; wrappers: V1NodePath<V1WrapperTypeNode>[] } {
    const wrappers: V1NodePath<V1WrapperTypeNode>[] = [];
    let current = path as V1NodePath<v1.TypeNode>;
    let node = getLastV1NodeFromPath(current);
    while (isV1WrapperTypeNode(node)) {
        wrappers.push(current as V1NodePath<V1WrapperTypeNode>);
        current = [...current, node.type];
        node = node.type;
    }
    return { path: current as V1NodePath<T>, wrappers };
}

/**
 * The path of the structural v1 type a v1 type path leads to, used to type
 * values: wrappers are removed and links followed, e.g. a path ending at
 * `fixedSizeTypeNode(definedTypeLinkNode('config'))` gives a path ending at
 * the struct of the `config` defined type. Returns `undefined` for missing
 * types, dangling links and alias cycles.
 */
export function resolveV1TypePath(
    typePath: V1NodePath<v1.TypeNode> | undefined,
): V1NodePath<Exclude<v1.TypeNode, v1.DefinedTypeLinkNode | V1WrapperTypeNode>> | undefined {
    const followed = new Set<v1.DefinedTypeNode>();
    let current = typePath;
    while (current) {
        const unwrapped = unwrapV1TypePath(current).path;
        const type = getLastV1NodeFromPath(unwrapped);
        if (type.kind !== 'definedTypeLinkNode') {
            return unwrapped as V1NodePath<Exclude<v1.TypeNode, v1.DefinedTypeLinkNode | V1WrapperTypeNode>>;
        }
        const definedTypePath = getV1LinkedDefinedTypePath(unwrapped as V1NodePath<v1.DefinedTypeLinkNode>);
        if (!definedTypePath) return undefined;
        const definedType = getLastV1NodeFromPath(definedTypePath);
        if (followed.has(definedType)) return undefined;
        followed.add(definedType);
        current = [...definedTypePath, definedType.type];
    }
    return undefined;
}
