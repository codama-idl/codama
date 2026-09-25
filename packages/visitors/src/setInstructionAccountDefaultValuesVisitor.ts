import { CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES, isCodamaError } from '@codama/errors';
import { snakeCase } from '@codama/fragments/casing';
import {
    assertIsNode,
    identityValueNode,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionInputValueNode,
    InstructionNode,
    instructionNode,
    payerValueNode,
    programIdValueNode,
    publicKeyValueNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    LinkableDictionary,
    NodePath,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    visit,
} from '@codama/visitors-core';

import { fillDefaultPdaSeedValuesVisitor } from './fillDefaultPdaSeedValuesVisitor';

export type InstructionAccountDefaultRule = {
    /** The identifier of the instruction account (matched exactly) or a pattern to match on it. */
    account: RegExp | string;
    /** The default value to assign to it. */
    defaultValue: InstructionInputValueNode;
    /**
     * Whether to leave the account untouched when it is optional or
     * already has a default value.
     * @defaultValue `false`.
     */
    ignoreIfOptional?: boolean;
    /**
     * The identifier of the instruction to restrict the rule to (matched exactly).
     * @defaultValue Defaults to searching accounts on all instructions.
     */
    instruction?: string;
};

/**
 * Match any of the given camelCase identifiers, as is or in snake_case,
 * since identifiers keep the casing of the program they come from.
 */
function anyIdentifierOf(...identifiers: string[]): RegExp {
    const alternatives = [...new Set(identifiers.flatMap(identifier => [identifier, snakeCase(identifier)]))];
    return new RegExp(`^(${alternatives.join('|')})$`);
}

/**
 * Default value rules for commonly used accounts (payers, authorities,
 * well-known programs and sysvars), matching their camelCase and
 * snake_case identifiers.
 */
export const getCommonInstructionAccountDefaultRules = (): InstructionAccountDefaultRule[] => [
    {
        account: anyIdentifierOf('payer', 'feePayer'),
        defaultValue: payerValueNode(),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('authority'),
        defaultValue: identityValueNode(),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('programId'),
        defaultValue: programIdValueNode(),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('systemProgram', 'splSystemProgram'),
        defaultValue: publicKeyValueNode('11111111111111111111111111111111', { identifier: 'splSystem' }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('tokenProgram', 'splTokenProgram'),
        defaultValue: publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', { identifier: 'splToken' }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('ataProgram', 'splAtaProgram'),
        defaultValue: publicKeyValueNode('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', {
            identifier: 'splAssociatedToken',
        }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('tokenMetadataProgram', 'mplTokenMetadataProgram'),
        defaultValue: publicKeyValueNode('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', {
            identifier: 'mplTokenMetadata',
        }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf(
            'tokenAuthRulesProgram',
            'mplTokenAuthRulesProgram',
            'authorizationRulesProgram',
            'mplAuthorizationRulesProgram',
            'authRulesProgram',
            'mplAuthRulesProgram',
        ),
        defaultValue: publicKeyValueNode('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg', {
            identifier: 'mplTokenAuthRules',
        }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('candyMachineProgram', 'mplCandyMachineProgram'),
        defaultValue: publicKeyValueNode('CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR', {
            identifier: 'mplCandyMachine',
        }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('candyGuardProgram', 'mplCandyGuardProgram'),
        defaultValue: publicKeyValueNode('Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g', {
            identifier: 'mplCandyGuard',
        }),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('clockSysvar', 'sysvarClock'),
        defaultValue: publicKeyValueNode('SysvarC1ock11111111111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('epochScheduleSysvar', 'sysvarEpochSchedule'),
        defaultValue: publicKeyValueNode('SysvarEpochSchedu1e111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf(
            ...['instructionSysvar', 'instructionsSysvar', 'sysvarInstruction', 'sysvarInstructions'].flatMap(
                identifier => [identifier, `${identifier}Account`],
            ),
        ),
        defaultValue: publicKeyValueNode('Sysvar1nstructions1111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('recentBlockhashesSysvar', 'sysvarRecentBlockhashes'),
        defaultValue: publicKeyValueNode('SysvarRecentB1ockHashes11111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('rent', 'rentSysvar', 'sysvarRent'),
        defaultValue: publicKeyValueNode('SysvarRent111111111111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('rewardsSysvar', 'sysvarRewards'),
        defaultValue: publicKeyValueNode('SysvarRewards111111111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('slotHashesSysvar', 'sysvarSlotHashes'),
        defaultValue: publicKeyValueNode('SysvarS1otHashes111111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('slotHistorySysvar', 'sysvarSlotHistory'),
        defaultValue: publicKeyValueNode('SysvarS1otHistory11111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('stakeHistorySysvar', 'sysvarStakeHistory'),
        defaultValue: publicKeyValueNode('SysvarStakeHistory1111111111111111111111111'),
        ignoreIfOptional: true,
    },
    {
        account: anyIdentifierOf('mplCoreProgram'),
        defaultValue: publicKeyValueNode('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d', { identifier: 'mplCore' }),
        ignoreIfOptional: true,
    },
];

/**
 * Set the default values of instruction accounts, including those of
 * sub-instructions, in bulk using the given rules.
 *
 * Rules restricted to an instruction take precedence over the others;
 * otherwise, the first matching rule wins. Missing seeds of PDA default
 * values are filled from the instruction's accounts and data (see
 * `fillDefaultPdaSeedValuesVisitor`): a rule whose PDA seeds cannot all be
 * filled is skipped for that account.
 *
 * @example
 * ```ts
 * setInstructionAccountDefaultValuesVisitor([
 *     ...getCommonInstructionAccountDefaultRules(),
 *     { account: 'counterProgram', defaultValue: publicKeyValueNode('MyCounterProgram11111111111111111111111111') },
 *     { account: /^(associatedToken|ata)$/, defaultValue: pdaValueNode('associatedToken') },
 * ]);
 * ```
 */
export function setInstructionAccountDefaultValuesVisitor(rules: InstructionAccountDefaultRule[]) {
    const linkables = new LinkableDictionary();

    // Place the rules with instructions first, without mutating the given rules.
    const sortedRules = [
        ...rules.filter(rule => rule.instruction !== undefined),
        ...rules.filter(rule => rule.instruction === undefined),
    ];

    const matchRule = (
        instruction: InstructionNode,
        account: InstructionAccountNode,
    ): InstructionAccountDefaultRule | undefined =>
        sortedRules.find(rule => {
            if (rule.instruction !== undefined && rule.instruction !== instruction.identifier) return false;
            return typeof rule.account === 'string'
                ? rule.account === account.identifier
                : rule.account.test(account.identifier);
        });

    const applyRule = (
        account: InstructionAccountNode,
        rule: InstructionAccountDefaultRule,
        instructionPath: NodePath<InstructionNode>,
    ): InstructionAccountNode => {
        if ((rule.ignoreIfOptional ?? false) && (account.isOptional || !!account.defaultValue)) return account;
        try {
            const defaultValue = visit(
                rule.defaultValue,
                fillDefaultPdaSeedValuesVisitor(instructionPath, linkables, true),
            );
            return instructionAccountNode({ ...account, defaultValue });
        } catch (error) {
            // The rule does not apply when its PDA seeds cannot all be filled.
            if (isCodamaError(error, CODAMA_ERROR__VISITORS__INVALID_PDA_SEED_VALUES)) return account;
            throw error;
        }
    };

    return pipe(
        bottomUpTransformerVisitor([
            {
                select: '[instructionNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'instructionNode');
                    const instructionPath = stack.getPath('instructionNode');
                    return instructionNode({
                        ...node,
                        accounts: (node.accounts ?? []).map(account => {
                            const rule = matchRule(node, account);
                            return rule ? applyRule(account, rule, instructionPath) : account;
                        }),
                    });
                },
            },
        ]),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
