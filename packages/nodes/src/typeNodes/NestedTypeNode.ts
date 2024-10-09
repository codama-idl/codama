import { KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND, KinobiError } from '@codama/errors';
import type { NestedTypeNode, Node, TypeNode } from '@codama/node-types';

import { isNode } from '../Node';
import { TYPE_NODES } from './TypeNode';

export function resolveNestedTypeNode<TType extends TypeNode>(typeNode: NestedTypeNode<TType>): TType {
    switch (typeNode.kind) {
        case 'fixedSizeTypeNode':
        case 'hiddenPrefixTypeNode':
        case 'hiddenSuffixTypeNode':
        case 'postOffsetTypeNode':
        case 'preOffsetTypeNode':
        case 'sentinelTypeNode':
        case 'sizePrefixTypeNode':
            return resolveNestedTypeNode<TType>(typeNode.type as NestedTypeNode<TType>);
        default:
            return typeNode;
    }
}

export function transformNestedTypeNode<TFrom extends TypeNode, TTo extends TypeNode>(
    typeNode: NestedTypeNode<TFrom>,
    map: (type: TFrom) => TTo,
): NestedTypeNode<TTo> {
    switch (typeNode.kind) {
        case 'fixedSizeTypeNode':
        case 'hiddenPrefixTypeNode':
        case 'hiddenSuffixTypeNode':
        case 'postOffsetTypeNode':
        case 'preOffsetTypeNode':
        case 'sentinelTypeNode':
        case 'sizePrefixTypeNode':
            return Object.freeze({
                ...typeNode,
                type: transformNestedTypeNode(typeNode.type as NestedTypeNode<TFrom>, map),
            } as NestedTypeNode<TTo>);
        default:
            return map(typeNode);
    }
}

export function isNestedTypeNode<TKind extends TypeNode['kind']>(
    node: Node | null | undefined,
    kind: TKind | TKind[],
): node is NestedTypeNode<Extract<TypeNode, { kind: TKind }>> {
    if (!isNode(node, TYPE_NODES)) return false;
    const kinds = Array.isArray(kind) ? kind : [kind];
    const resolved = resolveNestedTypeNode(node);
    return !!node && kinds.includes(resolved.kind as TKind);
}

export function assertIsNestedTypeNode<TKind extends TypeNode['kind']>(
    node: Node | null | undefined,
    kind: TKind | TKind[],
): asserts node is NestedTypeNode<Extract<TypeNode, { kind: TKind }>> {
    const kinds = Array.isArray(kind) ? kind : [kind];
    if (!isNestedTypeNode(node, kinds)) {
        throw new KinobiError(KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND, {
            expectedKinds: kinds,
            kind: node?.kind ?? null,
            node,
        });
    }
}
