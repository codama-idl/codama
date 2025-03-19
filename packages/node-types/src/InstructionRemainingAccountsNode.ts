import type { ArgumentValueNode, ResolverValueNode } from './contextualValueNodes';
import type { Docs } from './shared';

export interface InstructionRemainingAccountsNode<
    TValue extends ArgumentValueNode | ResolverValueNode = ArgumentValueNode | ResolverValueNode,
> {
    readonly kind: 'instructionRemainingAccountsNode';

    // Data.
    readonly isOptional?: boolean;
    readonly isSigner?: boolean | 'either';
    readonly isWritable?: boolean;
    readonly docs?: Docs;

    // Children.
    readonly value: TValue;
}
