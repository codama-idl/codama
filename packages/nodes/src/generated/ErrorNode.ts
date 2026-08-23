import type { ErrorNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export type ErrorNodeInput = Omit<ErrorNode, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/**
 * A program error — a numeric code paired with a name and human-readable message.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0bde98ea-0327-404b-bf38-137d105826b0)
 */
export function errorNode(input: ErrorNodeInput): ErrorNode {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'errorNode',

        // Data.
        name: camelCase(input.name),
        code: input.code,
        message: input.message,
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),
    });
}
