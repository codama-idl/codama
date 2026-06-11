import type { PdaSeedValueNode, PdaSeedValueValue } from '@codama/node-types';
import { camelCase } from '../../shared';

/** Pairs a PDA seed name with the value to substitute when deriving the PDA. */
export function pdaSeedValueNode<const TValue extends PdaSeedValueValue>(
    name: string,
    value: TValue,
): PdaSeedValueNode<TValue> {
    return Object.freeze({
        kind: 'pdaSeedValueNode',

        // Data.
        name: camelCase(name),

        // Children.
        value,
    });
}
