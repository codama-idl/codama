import { isObjectRecord } from '../shared/util';

/** An unwrapped decoded value: either a present inner value or an absent (`None`) one. */
export type UnwrappedOptionValue = { none: false; value: unknown } | { none: true };

/**
 * Recursively unwraps Kit `Option` wrappers (`{ __option: 'Some', value }` / `{ __option: 'None' }`)
 * from a decoded value. Non-option values pass through unchanged. The counterpart of
 * `resolveDisplayType` unwrapping option *types*: together they let presentation metadata attach to
 * the value inside the option.
 */
export function unwrapOptionValue(value: unknown): UnwrappedOptionValue {
    if (isObjectRecord(value) && typeof value.__option === 'string') {
        if (value.__option === 'None') return { none: true };
        return unwrapOptionValue(value.value);
    }
    return { none: false, value };
}
