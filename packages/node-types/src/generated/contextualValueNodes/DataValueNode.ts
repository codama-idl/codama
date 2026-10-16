import type { PathString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to a value within the data of the surrounding instruction. */
export interface DataValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'dataValueNode';

    // Data.
    /**
     * The path to the referenced value, relative to the instruction's data — e.g. `amount` or `config.fees[0]`.
     * Field segments are only valid where the data type resolves to a struct (following type links), and a `.data` segment crosses a public key's `accountLink` into the linked account's data, e.g. `mint.data.decimals`.
     * A path crossing an `accountLink` requires reading the linked account's state. When presenting, an unresolvable path falls back as usual. When building an instruction, e.g. for a PDA seed or a default value, there is nothing to fall back to: consumers that cannot or do not read the account must fail explicitly rather than guess.
     */
    readonly path: PathString;

    // Children.
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
