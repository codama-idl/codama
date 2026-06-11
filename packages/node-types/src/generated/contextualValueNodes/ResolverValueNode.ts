import type { CamelCaseString } from '../../brands';
import type { Docs } from '../../Docs';
import type { ResolverDependency } from './ResolverDependency';

/**
 * A custom resolver: a named function provided by the consumer that produces a value.
 * May optionally depend on other accounts and arguments resolved at instruction-build time.
 */
export interface ResolverValueNode<
    TDependsOn extends Array<ResolverDependency> | undefined = Array<ResolverDependency> | undefined,
> {
    readonly kind: 'resolverValueNode';

    // Data.
    /** The name of the resolver function. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the resolver. */
    readonly docs?: Docs;

    // Children.
    /** The accounts and arguments the resolver depends on. Used by clients to ensure the dependencies are resolved first. */
    readonly dependsOn?: TDependsOn;
}
