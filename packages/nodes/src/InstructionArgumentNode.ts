import type { InstructionArgumentNode } from '@codama/node-types';

import { structFieldTypeNode } from './generated/typeNodes/StructFieldTypeNode';
import { structTypeNode } from './generated/typeNodes/StructTypeNode';
import { VALUE_NODE_KINDS } from './generated/valueNodes/ValueNode';
import { isNode } from './Node';

export function structTypeNodeFromInstructionArgumentNodes(nodes: InstructionArgumentNode[]) {
    return structTypeNode(nodes.map(structFieldTypeNodeFromInstructionArgumentNode));
}

export function structFieldTypeNodeFromInstructionArgumentNode(node: InstructionArgumentNode) {
    if (isNode(node.defaultValue, VALUE_NODE_KINDS)) {
        return structFieldTypeNode({ ...node, defaultValue: node.defaultValue });
    }
    return structFieldTypeNode({
        ...node,
        defaultValue: undefined,
        defaultValueStrategy: undefined,
    });
}
