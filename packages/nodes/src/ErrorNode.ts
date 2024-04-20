import type { ErrorNode } from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';

export type ErrorNodeInput = Omit<ErrorNode, 'docs' | 'kind' | 'name'> & {
    readonly docs?: DocsInput;
    readonly name: string;
};

export function errorNode(input: ErrorNodeInput): ErrorNode {
    if (!input.name) {
        // TODO: Coded error.
        throw new Error('ErrorNode must have a name.');
    }

    if (input.code < 0) {
        // TODO: Coded error.
        throw new Error('ErrorNode must have a code number.');
    }

    return Object.freeze({
        kind: 'errorNode',

        // Data.
        name: camelCase(input.name),
        code: input.code,
        message: input.message,
        docs: parseDocs(input.docs),
    });
}
