import {
    accountBumpValueNode,
    accountDataValueNode,
    injectedValueNode,
    instructionAccountNode,
    instructionNode,
    payerValueNode,
    pdaNode,
    pdaValueNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { isAccountAutoResolvable } from '../../src/codegen/is-account-auto-resolvable';

describe('isAccountAutoResolvable', () => {
    test('should return false when account has no defaultValue', () => {
        const acc = instructionAccountNode({ identifier: 'plain', isSigner: false, isWritable: false });
        expect(isAccountAutoResolvable(acc)).toBe(false);
    });

    test.each([
        instructionAccountNode({
            defaultValue: { kind: 'identityValueNode' },
            identifier: 'identity',
            isSigner: true,
            isWritable: false,
        }),
        instructionAccountNode({
            defaultValue: { kind: 'payerValueNode' },
            identifier: 'payer',
            isSigner: true,
            isWritable: false,
        }),
    ])('should return false for identityValueNode and payerValueNode', acc => {
        expect(isAccountAutoResolvable(acc)).toBe(false);
    });

    test('should return true for pdaValueNode default', () => {
        const pda = pdaNode({
            identifier: 'thing',
            seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
        });
        const acc = instructionAccountNode({
            defaultValue: pdaValueNode(pda),
            identifier: 'thing',
            isSigner: false,
            isWritable: true,
        });
        expect(isAccountAutoResolvable(acc)).toBe(true);
    });

    test('it returns false for defaults requiring account fetches', () => {
        const bump = instructionAccountNode({
            defaultValue: accountBumpValueNode('pda'),
            identifier: 'a',
            isSigner: false,
            isWritable: false,
        });
        const data = instructionAccountNode({
            defaultValue: accountDataValueNode('mint', { path: 'owner' }),
            identifier: 'a',
            isSigner: false,
            isWritable: false,
        });
        expect(isAccountAutoResolvable(bump)).toBe(false);
        expect(isAccountAutoResolvable(data)).toBe(false);
    });

    test('it resolves injected defaults from the provides of the instruction', () => {
        const acc = instructionAccountNode({
            defaultValue: injectedValueNode({ key: 'pool' }),
            identifier: 'pool',
            isSigner: false,
            isWritable: false,
        });
        const providing = (node: Parameters<typeof providedNode>[1]) =>
            instructionNode({ accounts: [acc], identifier: 'ix', provides: [providedNode('pool', node)] });
        expect(isAccountAutoResolvable(acc)).toBe(false);
        expect(isAccountAutoResolvable(acc, providing(publicKeyValueNode('11111111111111111111111111111111')))).toBe(
            true,
        );
        expect(isAccountAutoResolvable(acc, providing(payerValueNode()))).toBe(false);
    });
});
