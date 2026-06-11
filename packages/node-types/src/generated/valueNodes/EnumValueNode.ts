import type { CamelCaseString } from '../../brands';
import type { DefinedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';
import type { EnumValuePayload } from './EnumValuePayload';

/** A concrete value of a defined enum: a variant identifier plus an optional payload. */
export interface EnumValueNode<
    TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    TValue extends EnumValuePayload | undefined = EnumValuePayload | undefined,
> {
    readonly kind: 'enumValueNode';

    // Data.
    /** The name of the selected variant. */
    readonly variant: CamelCaseString;

    // Children.
    /** A link to the defined enum type the value belongs to. */
    readonly enum: TEnum;
    /**
     * The variant payload — a struct value for struct variants or a tuple value for tuple variants.
     * Omitted for unit variants.
     */
    readonly value?: TValue;
}
