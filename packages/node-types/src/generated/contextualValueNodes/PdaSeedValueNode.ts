import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { PdaSeedValueValue } from './PdaSeedValueValue';

/** Pairs a PDA seed name with the value to substitute when deriving the PDA. */
export interface PdaSeedValueNode<
    TValue extends PdaSeedValueValue = PdaSeedValueValue,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'pdaSeedValueNode';

    // Data.
    /** The identifier of the seed being filled in — a `variablePdaSeedNode` of the PDA definition. */
    readonly identifier: IdentifierString;

    // Children.
    /** The value to substitute for the seed. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
