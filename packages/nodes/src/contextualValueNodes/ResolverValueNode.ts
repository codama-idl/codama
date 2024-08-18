import type { AccountValueNode, ArgumentValueNode, ResolverValueNode } from '@kinobi-so/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export function resolverValueNode<const TDependsOn extends (AccountValueNode | ArgumentValueNode)[] = []>(
    name: string,
    options: {
        dependsOn?: TDependsOn;
        docs?: DocsInput;
    } = {},
): ResolverValueNode<TDependsOn> {
    return Object.freeze({
        kind: 'resolverValueNode',

        // Data.
        name: camelCase(name),
        docs: parseDocs(options.docs),

        // Children.
        dependsOn: options.dependsOn,
    });
}
