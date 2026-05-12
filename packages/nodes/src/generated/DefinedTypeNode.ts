import type { DefinedTypeNode, TypeNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type DefinedTypeNodeInput<TType extends TypeNode = TypeNode> = Omit<
    DefinedTypeNode<TType>,
    'docs' | 'kind' | 'name'
> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A reusable named type that can be referenced by `definedTypeLinkNode` from elsewhere in the IDL. */
export function definedTypeNode<const TType extends TypeNode>(
    input: DefinedTypeNodeInput<TType>,
): DefinedTypeNode<TType> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'definedTypeNode',

        // Data.
        name: camelCase(input.name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        type: input.type,
    });
}
