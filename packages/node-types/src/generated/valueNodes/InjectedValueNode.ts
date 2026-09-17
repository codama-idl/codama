import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/**
 * A value resolved by key from a surrounding provider.
 * A `providedNode` higher in the resolution tree supplies the actual value; the consumer references only the `key`, so the same type stays portable across instructions that wire the key differently.
 * Resolution is lexical: a key resolves against the nearest enclosing `provides` list, innermost wins (shadowing allowed), and outer scopes remain visible — e.g. a sub-instruction may shadow a key provided by its parent.
 * IDLs must be self-contained: within its final context, every key must resolve to a provided entry or carry a `fallback`, so whether a value is resolvable is statically checkable.
 */
export interface InjectedValueNode<
    TFallback extends ValueNode | undefined = ValueNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'injectedValueNode';

    // Data.
    /** The key looked up against the surrounding provide/inject graph. */
    readonly key: IdentifierString;

    // Children.
    /**
     * A value used when no provider supplies the key.
     * When absent, the key is required: a provider must supply it for the surrounding context to be valid.
     */
    readonly fallback?: TFallback;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
