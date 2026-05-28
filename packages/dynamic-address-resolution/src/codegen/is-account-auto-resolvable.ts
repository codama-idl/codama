import type { InstructionAccountNode } from 'codama';

// Accounts with these default value nodes always require user input.
const nonResolvableValueNodes = ['payerValueNode', 'identityValueNode'];

/**
 * Determines if an account has an auto-resolvable default value.
 */
export function isAccountAutoResolvable(acc: InstructionAccountNode): boolean {
    if (acc.defaultValue == null) return false;
    return !nonResolvableValueNodes.includes(acc.defaultValue.kind);
}
