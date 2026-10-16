import type { IdentifierString } from '../../brands';
import type { DefinedTypeLinkNode } from '../linkNodes/DefinedTypeLinkNode';
import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/** A concrete value of a defined enum: a variant identifier plus an optional payload. */
export interface EnumValueNode<
    TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    TValue extends ValueNode | undefined = ValueNode | undefined,
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
     * The value of the variant's `data` — any value node matching its type, e.g. a struct value for a struct payload or an integer value for an integer payload.
     * Omitted for variants without data.
     */
    readonly value?: TValue;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
