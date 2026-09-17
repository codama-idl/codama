import type { InjectedValueNode, PluginNode, ValueNode } from '@codama/node-types';

import { identifierString } from '../../shared';

export type InjectedValueNodeInput<
    TFallback extends ValueNode | undefined = ValueNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<InjectedValueNode<TFallback, TPlugins>, 'key' | 'kind'> & {
    readonly key: string;
};

/**
 * A value resolved by key from a surrounding provider.
 * A `providedNode` higher in the resolution tree supplies the actual value; the consumer references only the `key`, so the same type stays portable across instructions that wire the key differently.
 * Resolution is lexical: a key resolves against the nearest enclosing `provides` list, innermost wins (shadowing allowed), and outer scopes remain visible — e.g. a sub-instruction may shadow a key provided by its parent.
 * IDLs must be self-contained: within its final context, every key must resolve to a provided entry or carry a `fallback`, so whether a value is resolvable is statically checkable.
 */
export function injectedValueNode<
    const TFallback extends ValueNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: InjectedValueNodeInput<TFallback, TPlugins>): InjectedValueNode<TFallback, TPlugins> {
    return Object.freeze({
        kind: 'injectedValueNode',

        // Data.
        key: identifierString(input.key),

        // Children.
        ...(input.fallback !== undefined && { fallback: input.fallback }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
