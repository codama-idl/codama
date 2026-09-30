import type { PluginNode } from '../PluginNode';
import type { TypeNode } from '../typeNodes/TypeNode';
import type { ConstantPdaSeedValue } from './ConstantPdaSeedValue';

/** A PDA seed with a constant value (e.g. a UTF-8 string or a fixed byte sequence). */
export interface ConstantPdaSeedNode<
    TType extends TypeNode = TypeNode,
    TValue extends ConstantPdaSeedValue = ConstantPdaSeedValue,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'constantPdaSeedNode';

    // Children.
    /** The type of the seed value. */
    readonly type: TType;
    /** The constant value to use as the seed — either a literal value or the program ID placeholder. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
