import type { ArgumentValueNode, ResolverValueNode } from './contextualValueNodes';

export interface InstructionRemainingAccountsNode<
    TValue extends ArgumentValueNode | ResolverValueNode = ArgumentValueNode | ResolverValueNode,
> {
    readonly kind: 'instructionRemainingAccountsNode';

    // Data.
    readonly docs: string[];
    readonly isOptional?: boolean;
    readonly isSigner?: boolean | 'either';
    readonly isWritable?: boolean;

    // Children.
    readonly value: TValue;
}
