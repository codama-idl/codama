import type { ConstantPdaSeedNode, ConstantPdaSeedValue, TypeNode } from '@codama/node-types';

/** A PDA seed with a constant value (e.g. a UTF-8 string or a fixed byte sequence). */
export function constantPdaSeedNode<const TType extends TypeNode, const TValue extends ConstantPdaSeedValue>(
    type: TType,
    value: TValue,
): ConstantPdaSeedNode<TType, TValue> {
    return Object.freeze({
        kind: 'constantPdaSeedNode',

        // Children.
        type,
        value,
    });
}
