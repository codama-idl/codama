import {
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionAccountNode,
    type InstructionInputValueNode,
    type InstructionNode,
    ProvidedScope,
} from 'codama';

// Accounts with these default values cannot be resolved without user input or fetching accounts.
const NON_RESOLVABLE_VALUE_NODES: InstructionInputValueNode['kind'][] = [
    'accountBumpValueNode',
    'accountDataValueNode',
    'identityValueNode',
    'payerValueNode',
];

/**
 * Whether an account can be omitted from the accounts input because its
 * default value resolves its address. Injected default values are resolved
 * from the `provides` of the given instruction, if any.
 */
export function isAccountAutoResolvable(acc: InstructionAccountNode, instruction?: InstructionNode): boolean {
    if (acc.defaultValue === undefined) return false;
    const scope = new ProvidedScope(instruction?.provides ?? []);
    const defaultValue = scope.resolve(acc.defaultValue, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
    return defaultValue !== undefined && !NON_RESOLVABLE_VALUE_NODES.includes(defaultValue.kind);
}
