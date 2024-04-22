import type { InstructionArgumentNode, InstructionInputValueNode } from '@kinobi-so/node-types';

import { isNode } from './Node';
import { camelCase, DocsInput, parseDocs } from './shared';
import { structFieldTypeNode } from './typeNodes/StructFieldTypeNode';
import { structTypeNode } from './typeNodes/StructTypeNode';
import { VALUE_NODES } from './valueNodes';

export type InstructionArgumentNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> = Omit<InstructionArgumentNode<TDefaultValue>, 'docs' | 'kind' | 'name'> & {
    readonly docs?: DocsInput;
    readonly name: string;
};

export function instructionArgumentNode<TDefaultValue extends InstructionInputValueNode | undefined = undefined>(
    input: InstructionArgumentNodeInput<TDefaultValue>,
): InstructionArgumentNode<TDefaultValue> {
    return Object.freeze({
        kind: 'instructionArgumentNode',

        // Data.
        name: camelCase(input.name),
        ...(input.defaultValueStrategy !== undefined && { defaultValueStrategy: input.defaultValueStrategy }),
        docs: parseDocs(input.docs),

        // Children.
        type: input.type,
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
    });
}

export function structTypeNodeFromInstructionArgumentNodes(nodes: InstructionArgumentNode[]) {
    return structTypeNode(nodes.map(structFieldTypeNodeFromInstructionArgumentNode));
}

export function structFieldTypeNodeFromInstructionArgumentNode(node: InstructionArgumentNode) {
    if (isNode(node.defaultValue, VALUE_NODES)) {
        return structFieldTypeNode({ ...node, defaultValue: node.defaultValue });
    }
    return structFieldTypeNode({
        ...node,
        defaultValue: undefined,
        defaultValueStrategy: undefined,
    });
}
