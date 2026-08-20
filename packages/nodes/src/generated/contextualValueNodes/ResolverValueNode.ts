import type { ResolverDependency, ResolverValueNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from '../../shared';

/**
 * A custom resolver: a named function provided by the consumer that produces a value.
 * May optionally depend on other accounts and arguments resolved at instruction-build time.
 * This node acts as a fallback for any value or logic that cannot easily be described by the other nodes — renderers treat resolvers as functions that can be injected into the generated code.
 */
export function resolverValueNode<const TDependsOn extends Array<ResolverDependency> | undefined = undefined>(
    name: string,
    options: {
        docs?: DocsInput;
        dependsOn?: TDependsOn;
    } = {},
): ResolverValueNode<TDependsOn> {
    const parsedDocs = parseDocs(options.docs);
    return Object.freeze({
        kind: 'resolverValueNode',

        // Data.
        name: camelCase(name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        ...(options.dependsOn !== undefined &&
            options.dependsOn.length > 0 && { dependsOn: options.dependsOn as TDependsOn }),
    });
}
