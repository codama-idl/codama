import type { ImportFrom, MainCaseString } from '../shared';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';

export interface ResolverValueNode<
    TDependsOn extends (AccountValueNode | ArgumentValueNode)[] = (AccountValueNode | ArgumentValueNode)[],
> {
    readonly kind: 'resolverValueNode';

    // Data.
    readonly name: MainCaseString;
    readonly importFrom?: ImportFrom;
    readonly docs: string[];

    // Children.
    readonly dependsOn?: TDependsOn;
}
