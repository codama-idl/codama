import type { AccountValueNode, ArgumentValueNode, ImportFrom, ResolverValueNode } from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export function resolverValueNode<const TDependsOn extends (AccountValueNode | ArgumentValueNode)[] = []>(
    name: string,
    options: {
        dependsOn?: TDependsOn;
        docs?: DocsInput;
        importFrom?: ImportFrom;
    } = {},
): ResolverValueNode<TDependsOn> {
    return Object.freeze({
        kind: 'resolverValueNode',

        // Data.
        name: camelCase(name),
        ...(options.importFrom && { importFrom: options.importFrom }),
        docs: parseDocs(options.docs),

        // Children.
        dependsOn: options.dependsOn,
    });
}
