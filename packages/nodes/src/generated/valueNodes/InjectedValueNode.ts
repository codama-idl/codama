import type { InjectedValueNode, ValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

export type InjectedValueNodeInput<TFallback extends ValueNode | undefined = ValueNode | undefined> = Omit<
    InjectedValueNode<TFallback>,
    'key' | 'kind'
> & {
    readonly key: string;
};

/**
 * A value resolved by key from a surrounding provider.
 * A `providedNode` higher in the resolution tree supplies the actual value; the consumer references only the `key`, so the same type stays portable across instructions that wire the key differently.
 * Resolution is a per-context property: a value with the same key may resolve in one instruction and not another.
 */
export function injectedValueNode<const TFallback extends ValueNode | undefined = undefined>(
    input: InjectedValueNodeInput<TFallback>,
): InjectedValueNode<TFallback> {
    return Object.freeze({
        kind: 'injectedValueNode',

        // Data.
        key: camelCase(input.key),

        // Children.
        ...(input.fallback !== undefined && { fallback: input.fallback }),
    });
}
