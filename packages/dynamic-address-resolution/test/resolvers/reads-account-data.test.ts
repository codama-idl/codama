import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND } from '@codama/errors';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    dataValueNode,
    injectedValueNode,
    instructionAccountNode,
    type InstructionAccountNode,
    instructionNode,
    type InstructionNodeInput,
    integerTypeNode,
    LinkableDictionary,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { readsAccountData } from '../../src';

const mint = accountNode({
    data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
    identifier: 'mint',
});
const data = structTypeNode([
    structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }) }),
    structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
]);

function account(identifier: string, input: Partial<InstructionAccountNode> = {}) {
    return instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...input });
}

/** Whether the instruction built from the given input reads account data. */
function reads(input: Partial<InstructionNodeInput>): boolean {
    const instruction = instructionNode({ data, identifier: 'myInstruction', ...input });
    const root = rootNode(
        programNode({
            accounts: [mint],
            identifier: 'myProgram',
            instructions: [instruction],
            pdas: [pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('seed', integerTypeNode('u8'))] })],
            publicKey: '1111',
        }),
    );
    return readsAccountData([root, root.program, instruction]);
}

describe('readsAccountData', () => {
    test('it returns false for instructions without contextual default values reading accounts', () => {
        expect(reads({ accounts: [account('owner', { defaultValue: dataValueNode('owner') })] })).toBe(false);
    });

    test('it returns true for accounts defaulting to account data', () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'decimals' }) });
        expect(reads({ accounts: [account('mint', { accountLink: accountLinkNode('mint') }), owner] })).toBe(true);
    });

    test('it returns true for data paths crossing account links', () => {
        expect(reads({ accounts: [account('owner', { defaultValue: dataValueNode('mint.decimals') })] })).toBe(true);
    });

    test('it returns false for invalid data paths', () => {
        expect(reads({ accounts: [account('owner', { defaultValue: dataValueNode('mint.unknown') })] })).toBe(false);
    });

    test('it returns true for nested contextual values reading accounts', () => {
        const seed = pdaSeedValueNode('seed', dataValueNode('mint.decimals'));
        const vault = account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault'), { seeds: [seed] }) });
        expect(reads({ accounts: [vault] })).toBe(true);
    });

    test('it returns true for injected values reading accounts', () => {
        const decimals = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'decimals' }),
            identifier: 'decimals',
            type: integerTypeNode('u8'),
        });
        expect(
            reads({
                accounts: [account('mint', { accountLink: accountLinkNode('mint') })],
                data: structTypeNode([decimals]),
                provides: [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))],
            }),
        ).toBe(true);
    });

    test('it uses the given linkables rather than recording them', () => {
        // Given linkables that do not record the mint, so the account link cannot be followed.
        const instruction = instructionNode({
            accounts: [account('owner', { defaultValue: dataValueNode('mint.decimals') })],
            data,
            identifier: 'myInstruction',
        });
        const root = rootNode(
            programNode({ accounts: [mint], identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }),
        );
        expect(() => readsAccountData([root, root.program, instruction], new LinkableDictionary())).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
            }),
        );
    });
});
