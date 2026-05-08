import type { CamelCaseString } from '../../brands';
import type { PdaSeedValueValue } from './PdaSeedValueValue';

/** Pairs a PDA seed name with the value to substitute when deriving the PDA. */
export interface PdaSeedValueNode<TValue extends PdaSeedValueValue = PdaSeedValueValue> {
    readonly kind: 'pdaSeedValueNode';

    // Data.
    /** The name of the seed being filled in. */
    readonly name: CamelCaseString;

    // Children.
    /** The value to substitute for the seed. */
    readonly value: TValue;
}
