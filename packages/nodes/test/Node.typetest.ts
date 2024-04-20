import type { Node, PublicKeyTypeNode, TupleTypeNode } from '@kinobi-so/node-types';

import {
    assertIsNode,
    assertIsNodeFilter,
    isNode,
    isNodeFilter,
    REGISTERED_NODE_KINDS,
    removeNullAndAssertIsNodeFilter,
} from '../src/index.js';

// [DESCRIBE] Registered node kinds.
{
    // It matches exactly with Node['kind'].
    {
        REGISTERED_NODE_KINDS satisfies readonly Node['kind'][];
        null as unknown as Node['kind'] satisfies (typeof REGISTERED_NODE_KINDS)[number];
    }
}

// [DESCRIBE] isNode.
{
    // It narrows the type of a node to the given kind.
    {
        const node = {} as Node | null;
        if (isNode(node, 'tupleTypeNode')) {
            node satisfies TupleTypeNode;
            // @ts-expect-error Expected TupleTypeNode.
            node satisfies PublicKeyTypeNode;
        }
    }

    // It narrows the type of a node to union of the given kinds.
    {
        const node = {} as Node | null;
        if (isNode(node, ['tupleTypeNode', 'publicKeyTypeNode'])) {
            node satisfies PublicKeyTypeNode | TupleTypeNode;
            // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
            node satisfies TupleTypeNode;
            // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
            node satisfies PublicKeyTypeNode;
        }
    }
}

// [DESCRIBE] assertIsNode.
{
    // It narrows the type of a node to the given kind.
    {
        const node = {} as Node | null;
        assertIsNode(node, 'tupleTypeNode');
        node satisfies TupleTypeNode;
        // @ts-expect-error Expected TupleTypeNode.
        node satisfies PublicKeyTypeNode;
    }

    // It narrows the type of a node to union of the given kinds.
    {
        const node = {} as Node | null;
        assertIsNode(node, ['tupleTypeNode', 'publicKeyTypeNode']);
        node satisfies PublicKeyTypeNode | TupleTypeNode;
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        node satisfies TupleTypeNode;
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        node satisfies PublicKeyTypeNode;
    }
}

// [DESCRIBE] isNodeFilter.
{
    // It narrows the type of an array of nodes to the given kind.
    {
        const nodes = ([] as (Node | null)[]).filter(isNodeFilter('tupleTypeNode'));
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected TupleTypeNode.
        nodes satisfies PublicKeyTypeNode[];
    }

    // It narrows the type of an array of nodes to union of the given kinds.
    {
        const nodes = ([] as (Node | null)[]).filter(isNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']));
        nodes satisfies (PublicKeyTypeNode | TupleTypeNode)[];
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        nodes satisfies PublicKeyTypeNode[];
    }
}

// [DESCRIBE] assertIsNodeFilter.
{
    // It narrows the type of an array of nodes to the given kind.
    {
        const nodes = ([] as (Node | null)[]).filter(assertIsNodeFilter('tupleTypeNode'));
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected TupleTypeNode.
        nodes satisfies PublicKeyTypeNode[];
    }

    // It narrows the type of an array of nodes to union of the given kinds.
    {
        const nodes = ([] as (Node | null)[]).filter(assertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']));
        nodes satisfies (PublicKeyTypeNode | TupleTypeNode)[];
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected PublicKeyTypeNode | TupleTypeNode.
        nodes satisfies PublicKeyTypeNode[];
    }
}

// [DESCRIBE] removeNullAndAssertIsNodeFilter.
{
    // It narrows the type of an array of nodes to the given kind.
    {
        const nodes = ([] as (Node | null)[]).filter(removeNullAndAssertIsNodeFilter('tupleTypeNode'));
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected TupleTypeNode[]
        nodes satisfies PublicKeyTypeNode[];
    }

    // It narrows the type of an array of nodes to union of the given kinds.
    {
        const nodes = ([] as (Node | null)[]).filter(
            removeNullAndAssertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']),
        );
        nodes satisfies (PublicKeyTypeNode | TupleTypeNode)[];
        // @ts-expect-error Expected (PublicKeyTypeNode | TupleTypeNode)[]
        nodes satisfies TupleTypeNode[];
        // @ts-expect-error Expected (PublicKeyTypeNode | TupleTypeNode)[]
        nodes satisfies PublicKeyTypeNode[];
    }
}
