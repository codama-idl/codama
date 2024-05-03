import type { GetNodeFromKind, PublicKeyTypeNode, StringTypeNode } from '../src';

// [DESCRIBE] GetNodeFromKind.
{
    // It extracts the node from the kind.
    {
        const node = {} as GetNodeFromKind<'publicKeyTypeNode'>;
        node satisfies PublicKeyTypeNode;
    }

    // It extracts node unions from multiple kinds.
    {
        const node = {} as GetNodeFromKind<'publicKeyTypeNode' | 'stringTypeNode'>;
        node satisfies PublicKeyTypeNode | StringTypeNode;
    }
}
