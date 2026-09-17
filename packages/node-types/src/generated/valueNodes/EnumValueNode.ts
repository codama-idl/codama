import type { IdentifierString } from '../../brands';
import type { DefinedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';
import type { PluginNode } from '../PluginNode';
import type { EnumValuePayload } from './EnumValuePayload';

/** A concrete value of a defined enum: a variant identifier plus an optional payload. */
export interface EnumValueNode<
    TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    TValue extends EnumValuePayload | undefined = EnumValuePayload | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'enumValueNode';

    // Data.
    /** The identifier of the selected variant. */
    readonly variant: IdentifierString;

    // Children.
    /**
     * A link to the defined enum type the value belongs to.
     * The linked defined type must contain an `enumTypeNode`.
     */
    readonly enum: TEnum;
    /**
     * The variant payload — a struct value for struct variants or a tuple value for tuple variants.
     * Omitted for unit variants.
     */
    readonly value?: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
