import { type AccountNode, type RegisteredTypeNode, resolveNestedTypeNode, type TypeNode } from '@codama/nodes';
import { visit, Visitor } from '@codama/visitors-core';

export type GpaField = {
    name: string;
    offset: number | null;
    type: TypeNode;
};

export function getGpaFieldsFromAccount(
    node: AccountNode,
    sizeVisitor: Visitor<number | null, RegisteredTypeNode['kind'] | 'definedTypeLinkNode'>,
): GpaField[] {
    let offset: number | null = 0;
    const struct = resolveNestedTypeNode(node.data);
    return struct.fields.map((field): GpaField => {
        const fieldOffset = offset;
        if (offset !== null) {
            const newOffset = visit(field.type, sizeVisitor);
            offset = newOffset !== null ? offset + newOffset : null;
        }
        return { name: field.name, offset: fieldOffset, type: field.type };
    });
}
