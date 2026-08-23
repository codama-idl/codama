import type { CamelCaseString } from '../../brands';
import type { Docs } from '../../Docs';
import type { ResolverDependency } from './ResolverDependency';

/**
 * A custom resolver: a named function provided by the consumer that produces a value.
 * May optionally depend on other accounts and arguments resolved at instruction-build time.
 * This node acts as a fallback for any value or logic that cannot easily be described by the other nodes — renderers treat resolvers as functions that can be injected into the generated code.
 */
export interface ResolverValueNode<
    TDependsOn extends Array<ResolverDependency> | undefined = Array<ResolverDependency> | undefined,
> {
    readonly kind: 'resolverValueNode';

    // Data.
    /**
     * A unique name for the resolver.
     * This is typically the name of the function that renderers will invoke.
     */
    readonly name: CamelCaseString;
    /** Markdown documentation for the resolver. */
    readonly docs?: Docs;

    // Children.
    /** The accounts and arguments the resolver depends on. Used by clients to ensure the dependencies are resolved first. */
    readonly dependsOn?: TDependsOn;
}
