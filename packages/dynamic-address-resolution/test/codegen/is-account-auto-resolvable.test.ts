import { instructionAccountNode, pdaNode, pdaValueNode, publicKeyTypeNode, variablePdaSeedNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { isAccountAutoResolvable } from '../../src/codegen/is-account-auto-resolvable';

describe('isAccountAutoResolvable', () => {
    test('should return false when account has no defaultValue', () => {
        const acc = instructionAccountNode({ isSigner: false, isWritable: false, name: 'plain' });
        expect(isAccountAutoResolvable(acc)).toBe(false);
    });

    test.each([
        instructionAccountNode({
            defaultValue: { kind: 'identityValueNode' },
            isSigner: true,
            isWritable: false,
            name: 'identity',
        }),
        instructionAccountNode({
            defaultValue: { kind: 'payerValueNode' },
            isSigner: true,
            isWritable: false,
            name: 'payer',
        }),
    ])('should return false for identityValueNode and payerValueNode', acc => {
        expect(isAccountAutoResolvable(acc)).toBe(false);
    });

    test('should return true for pdaValueNode default', () => {
        const pda = pdaNode({
            name: 'thing',
            seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
        });
        const acc = instructionAccountNode({
            defaultValue: pdaValueNode(pda),
            isSigner: false,
            isWritable: true,
            name: 'thing',
        });
        expect(isAccountAutoResolvable(acc)).toBe(true);
    });
});
