import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CodamaError } from '@codama/errors';
import { DefinedTypeLinkNode, DefinedTypeNode, isNode, Node, PathString, RegisteredTypeNode } from '@codama/nodes';

import { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath, NodePath } from './NodePath';

/** A segment of a path expression, e.g. `config` or `[0]` in `config.fees[0]`. */
export type PathSegment = { identifier: string; kind: 'field' } | { index: number; kind: 'index' };

/** A node a type path can start from or resolve to. */
export type TypePathNode = DefinedTypeLinkNode | RegisteredTypeNode;

/**
 * The path to a {@link TypePathNode}. Unlike `NodePath<TypePathNode>`, which
 * distributes over each node kind, it accepts paths ending with any of them,
 * e.g. `[...instructionPath, instruction.data]`.
 */
export type TypePath = readonly [...(readonly Node[]), TypePathNode];

const PATH_SEGMENT_REGEX = /(?:^|\.)([A-Za-z_][A-Za-z0-9_]*)|\[(0|[1-9][0-9]*)\]/g;

/**
 * Split a path expression into its field and index segments.
 *
 * @example
 * ```ts
 * parsePath('config.fees[0]');
 * // [{ kind: 'field', identifier: 'config' }, { kind: 'field', identifier: 'fees' }, { kind: 'index', index: 0 }]
 * ```
 */
export function parsePath(path: string): PathSegment[] {
    return [...path.matchAll(PATH_SEGMENT_REGEX)].map(([, identifier, index]) =>
        identifier !== undefined ? { identifier, kind: 'field' } : { index: Number(index), kind: 'index' },
    );
}

/**
 * Resolve a path expression against the type at the end of `source` and
 * return the full path of the node it points to.
 *
 * A `.identifier` segment selects a struct field and an `[n]` segment
 * selects the n-th item of a tuple, or the item of an array or set. Struct
 * fields, enum variants and `definedTypeLinkNode`s along the way resolve to
 * their types, following links to their definitions so the returned path
 * reflects where each node is defined. The last node is returned as
 * addressed, e.g. a struct field whose type is a link. Indices into arrays
 * and sets are not checked against their count, as they select the item type.
 *
 * @param source - The path to the type the path expression is relative to,
 *   e.g. `[root, program, instruction, instruction.data]`.
 * @param path - The path expression, e.g. `config.fees[0]`.
 * @param linkables - Used to follow `definedTypeLinkNode`s.
 * @throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` when a segment cannot be followed.
 * @throws `CODAMA_ERROR__LINKED_NODE_NOT_FOUND` when a link cannot be resolved.
 *
 * @example
 * ```ts
 * // instruction.data: struct { config: link(config) } — config: struct { fees: array(u16) }
 * resolveTypePath([root, program, instruction, instruction.data], 'config.fees[0]', linkables);
 * // [root, program, configType, configStruct, feesField, feesArray, u16]
 * ```
 */
export function resolveTypePath(
    source: TypePath,
    path: PathString,
    linkables: LinkableDictionary,
): NodePath<TypePathNode> {
    const resolved = parsePath(path).reduce((current, segment) => {
        const container = resolveContainer(current, linkables, path, segment);
        const type = getLastTypePathNode(container);
        const withChild = (child: TypePathNode): TypePath => [...container, child];

        if (segment.kind === 'field') {
            const field = isNode(type, 'structTypeNode')
                ? (type.fields ?? []).find(field => field.identifier === segment.identifier)
                : undefined;
            if (field) return withChild(field);
        } else if (isNode(type, 'tupleTypeNode')) {
            const item = (type.items ?? [])[segment.index];
            if (item) return withChild(item);
        } else if (isNode(type, ['arrayTypeNode', 'setTypeNode'])) {
            return withChild(type.item);
        }
        throw getCannotResolvePathError(container, path, segment);
    }, source);
    return resolved as NodePath<TypePathNode>;
}

/**
 * Resolve struct fields, enum variants and links to the type they describe,
 * so the next segment can be applied to it.
 */
function resolveContainer(
    source: TypePath,
    linkables: LinkableDictionary,
    path: PathString,
    segment: PathSegment,
): TypePath {
    let current = source;
    const followedTypes = new Set<DefinedTypeNode>();
    for (;;) {
        const node = getLastTypePathNode(current);
        if (isNode(node, 'structFieldTypeNode')) {
            current = [...current, node.type];
        } else if (isNode(node, 'enumVariantTypeNode')) {
            if (!node.data) throw getCannotResolvePathError(current, path, segment);
            current = [...current, node.data];
        } else if (isNode(node, 'definedTypeLinkNode')) {
            const definedTypePath = linkables.getPathOrThrow(current as NodePath<DefinedTypeLinkNode>);
            const definedType = getLastNodeFromPath(definedTypePath);
            // An alias cycle (e.g. `a = b`, `b = a`) never reaches a type to apply the segment to.
            if (followedTypes.has(definedType)) throw getCannotResolvePathError(current, path, segment);
            followedTypes.add(definedType);
            current = [...definedTypePath, definedType.type];
        } else {
            return current;
        }
    }
}

function getLastTypePathNode(path: TypePath): TypePathNode {
    return path[path.length - 1] as TypePathNode;
}

function getCannotResolvePathError(nodePath: NodePath, path: PathString, segment: PathSegment): CodamaError {
    return new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        nodePath,
        path,
        segment: segment.kind === 'field' ? segment.identifier : `[${segment.index}]`,
    });
}
