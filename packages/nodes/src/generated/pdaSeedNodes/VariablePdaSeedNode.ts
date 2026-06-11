import type { TypeNode, VariablePdaSeedNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../../shared';

/** A PDA seed whose value is provided at derivation time, identified by name. */
export function variablePdaSeedNode<const TType extends TypeNode>(
    name: string,
    type: TType,
    docs?: DocsInput,
): VariablePdaSeedNode<TType> {
    const parsedDocs = parseDocs(docs);
    return Object.freeze({
        kind: 'variablePdaSeedNode',

        // Data.
        name: camelCase(name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        type,
    });
}
