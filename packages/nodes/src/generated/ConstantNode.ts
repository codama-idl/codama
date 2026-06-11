import type { ConstantNode, TypeNode, ValueNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

/** A named constant exposed by the program: a typed value associated with a name. */
export function constantNode<const TType extends TypeNode, const TValue extends ValueNode>(
    name: string,
    type: TType,
    value: TValue,
    docs?: DocsInput,
): ConstantNode<TType, TValue> {
    const parsedDocs = parseDocs(docs);
    return Object.freeze({
        kind: 'constantNode',

        // Data.
        name: camelCase(name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        type,
        value,
    });
}
