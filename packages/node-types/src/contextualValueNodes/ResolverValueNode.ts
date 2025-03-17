import type { CamelCaseString, Docs } from '../shared';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

export interface ResolverValueNode<
    TDependsOn extends (AccountValueNode | ArgumentValueNode)[] = (AccountValueNode | ArgumentValueNode)[],
> {
    readonly kind: 'resolverValueNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;

    // Children.
    readonly dependsOn?: TDependsOn;
}
