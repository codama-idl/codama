import type { TypeNode, VariablePdaSeedNode } from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export function variablePdaSeedNode<TType extends TypeNode>(
    name: string,
    type: TType,
    docs?: DocsInput,
): VariablePdaSeedNode<TType> {
    return Object.freeze({
        kind: 'variablePdaSeedNode',

        // Data.
        name: camelCase(name),
        docs: parseDocs(docs),

        // Children.
        type,
    });
}
