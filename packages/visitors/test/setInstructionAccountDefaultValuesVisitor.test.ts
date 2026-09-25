import {
    accountValueNode,
    assertIsNode,
    identityValueNode,
    instructionAccountNode,
    InstructionAccountNode,
    instructionNode,
    InstructionNode,
    Node,
    payerValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import {
    getCommonInstructionAccountDefaultRules,
    InstructionAccountDefaultRule,
    setInstructionAccountDefaultValuesVisitor,
} from '../src';

const account = (identifier: string, options: Partial<InstructionAccountNode> = {}) =>
    instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...options });

const programWith = (...instructions: InstructionNode[]) =>
    programNode({
        identifier: 'myProgram',
        instructions,
        pdas: [pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] })],
        publicKey: '1111',
    });

const getAccounts = (node: Node | null, index = 0) => {
    assertIsNode(node, 'programNode');
    return node.instructions?.[index].accounts ?? [];
};

test('it sets the default values of matching accounts', () => {
    // Given an instruction with a payer and a system program.
    const node = programWith(
        instructionNode({ accounts: [account('payer'), account('systemProgram')], identifier: 'create' }),
    );

    // When we apply the common rules.
    const result = visit(node, setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules()));

    // Then both accounts get their default values.
    expect(getAccounts(result).map(a => a.defaultValue)).toStrictEqual([
        payerValueNode(),
        publicKeyValueNode('11111111111111111111111111111111', { identifier: 'splSystem' }),
    ]);
});

test('the common rules match snake_case identifiers', () => {
    // Given an instruction with snake_case accounts.
    const node = programWith(
        instructionNode({
            accounts: [account('fee_payer'), account('token_program'), account('sysvar_instructions_account')],
            identifier: 'create',
        }),
    );

    // When we apply the common rules, then every account gets a default value.
    const result = visit(node, setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules()));
    expect(getAccounts(result).map(a => a.defaultValue?.kind)).toStrictEqual([
        'payerValueNode',
        'publicKeyValueNode',
        'publicKeyValueNode',
    ]);
});

test('it matches string identifiers exactly', () => {
    // Given an instruction with a snake_case account.
    const node = programWith(instructionNode({ accounts: [account('my_program')], identifier: 'create' }));
    const defaultValue = publicKeyValueNode('11111111111111111111111111111111');

    // When a rule uses another casing, then nothing changes.
    expect(
        visit(node, setInstructionAccountDefaultValuesVisitor([{ account: 'myProgram', defaultValue }])),
    ).toStrictEqual(node);

    // When a rule uses the exact identifier, then the default value is set.
    const result = visit(node, setInstructionAccountDefaultValuesVisitor([{ account: 'my_program', defaultValue }]));
    expect(getAccounts(result)[0].defaultValue).toStrictEqual(defaultValue);
});

test('it ignores optional or defaulted accounts when requested', () => {
    // Given an optional account and an account with a default value.
    const node = programWith(
        instructionNode({
            accounts: [
                account('authority', { isOptional: true }),
                account('payer', { defaultValue: identityValueNode() }),
            ],
            identifier: 'create',
        }),
    );

    // When we apply the common rules, then neither account changes.
    expect(
        visit(node, setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules())),
    ).toStrictEqual(node);
});

test('it gives precedence to rules restricted to an instruction without mutating the rules', () => {
    // Given two instructions with an `authority` account.
    const node = programWith(
        instructionNode({ accounts: [account('authority')], identifier: 'create' }),
        instructionNode({ accounts: [account('authority')], identifier: 'close' }),
    );

    // And a global rule declared before an instruction-specific one.
    const rules: InstructionAccountDefaultRule[] = [
        { account: 'authority', defaultValue: identityValueNode() },
        { account: 'authority', defaultValue: payerValueNode(), instruction: 'close' },
    ];
    const rulesCopy = [...rules];

    // When we apply them.
    const result = visit(node, setInstructionAccountDefaultValuesVisitor(rules));

    // Then the instruction-specific rule wins for its instruction only.
    expect(getAccounts(result, 0)[0].defaultValue).toStrictEqual(identityValueNode());
    expect(getAccounts(result, 1)[0].defaultValue).toStrictEqual(payerValueNode());
    expect(rules).toStrictEqual(rulesCopy);
});

test('it fills PDA seeds and skips rules whose seeds cannot be filled', () => {
    // Given an instruction with an owner and one without.
    const node = programWith(
        instructionNode({ accounts: [account('owner'), account('vault')], identifier: 'deposit' }),
        instructionNode({ accounts: [account('vault')], identifier: 'close' }),
    );

    // When we default the vault account to its PDA.
    const result = visit(
        node,
        setInstructionAccountDefaultValuesVisitor([{ account: 'vault', defaultValue: pdaValueNode('vault') }]),
    );

    // Then the seed is filled where possible and the rule is skipped otherwise.
    expect(getAccounts(result, 0)[1].defaultValue).toStrictEqual(
        pdaValueNode('vault', { seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))] }),
    );
    expect(getAccounts(result, 1)[0].defaultValue).toBeUndefined();
});

test('it sets the default values of sub-instruction accounts', () => {
    // Given an instruction with a sub-instruction.
    const node = programWith(
        instructionNode({
            identifier: 'parent',
            subInstructions: [instructionNode({ accounts: [account('payer')], identifier: 'child' })],
        }),
    );

    // When we apply the common rules, then the sub-instruction account gets a default value.
    const result = visit(node, setInstructionAccountDefaultValuesVisitor(getCommonInstructionAccountDefaultRules()));
    assertIsNode(result, 'programNode');
    expect(result.instructions?.[0].subInstructions?.[0].accounts?.[0].defaultValue).toStrictEqual(payerValueNode());
});
