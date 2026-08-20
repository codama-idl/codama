import type { CamelCaseString } from '../../brands';
import type { ValueNode } from './ValueNode';

/**
 * A value resolved by key from a surrounding provider.
 * A `providedNode` higher in the resolution tree supplies the actual value; the consumer references only the `key`, so the same type stays portable across instructions that wire the key differently.
 * Resolution is a per-context property: a value with the same key may resolve in one instruction and not another.
 */
export interface InjectedValueNode<TFallback extends ValueNode | undefined = ValueNode | undefined> {
    readonly kind: 'injectedValueNode';

    // Data.
    /** The key looked up against the surrounding provide/inject graph. */
    readonly key: CamelCaseString;

    // Children.
    /**
     * A value used when no provider supplies the key.
     * When absent, the key is required: a provider must supply it for the surrounding context to be valid.
     */
    readonly fallback?: TFallback;
}
