import type { StructFieldDisplayNode, StructFieldTypeNode, TypeNode, ValueNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../../shared';

export type StructFieldTypeNodeInput<
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
    TDisplay extends StructFieldDisplayNode | undefined = StructFieldDisplayNode | undefined,
> = Omit<StructFieldTypeNode<TType, TDefaultValue, TDisplay>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A named field within a struct type. */
export function structFieldTypeNode<
    const TType extends TypeNode,
    const TDefaultValue extends ValueNode | undefined = undefined,
    const TDisplay extends StructFieldDisplayNode | undefined = undefined,
>(
    input: StructFieldTypeNodeInput<TType, TDefaultValue, TDisplay>,
): StructFieldTypeNode<TType, TDefaultValue, TDisplay> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'structFieldTypeNode',

        // Data.
        name: camelCase(input.name),
        ...(input.defaultValueStrategy !== undefined && { defaultValueStrategy: input.defaultValueStrategy }),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        type: input.type,
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
        ...(input.display !== undefined && { display: input.display }),
    });
}
