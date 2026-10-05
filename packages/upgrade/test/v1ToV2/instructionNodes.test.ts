import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    accountBumpValueNode,
    accountDataValueNode,
    accountLinkNode,
    accountValueNode,
    conditionalValueNode,
    dataValueNode,
    definedTypeLinkNode,
    enumValueNode,
    fieldDiscriminatorNode,
    floatValueNode,
    identityValueNode,
    injectedValueNode,
    instructionAccountNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    instructionStatusNode,
    integerTypeNode,
    integerValueNode,
    payerValueNode,
    pdaSeedValueNode,
    pdaValueNode,
    pluginNode,
    programLinkNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import type { v1 } from '../../src';
import { instructionNodeFromV1 } from '../../src/v1ToV2';

// A root whose program defines a PDA with a float seed, to type the seed values of PDA defaults.
const root = {
    kind: 'rootNode',
    program: {
        kind: 'programNode',
        name: 'myProgram',
        pdas: [
            {
                kind: 'pdaNode',
                name: 'ratioPda',
                seeds: [
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'ratio',
                        type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                    },
                ],
            },
        ],
        publicKey: '1111',
        version: '1.0.0',
    },
    standard: 'codama',
    version: '1.9.0',
} as unknown as v1.RootNode;
const programPath = [root, root.program];

describe('instructions', () => {
    test('it converts instructions without data', () => {
        const instruction = {
            discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'discriminator', offset: 0 }],
            docs: ['Does nothing.'],
            kind: 'instructionNode',
            name: 'noop',
            optionalAccountStrategy: 'omitted',
            plugins: [{ kind: 'pluginNode', name: 'explorerHints', payload: { hidden: true } }],
            status: { kind: 'instructionStatusNode', lifecycle: 'deprecated', message: 'Use `ping`.' },
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                discriminators: [fieldDiscriminatorNode('discriminator')],
                docs: 'Does nothing.',
                identifier: 'noop',
                optionalAccountStrategy: 'omitted',
                plugins: [pluginNode('explorerHints', { hidden: true })],
                status: instructionStatusNode('deprecated', { message: 'Use `ping`.' }),
            }),
        );
    });

    test('it converts sub-instructions', () => {
        const instruction = {
            kind: 'instructionNode',
            name: 'parent',
            optionalAccountStrategy: 'programId',
            subInstructions: [{ kind: 'instructionNode', name: 'child', optionalAccountStrategy: 'programId' }],
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({ identifier: 'parent', subInstructions: [instructionNode({ identifier: 'child' })] }),
        );
    });

    test('it converts the provided nodes of instructions', () => {
        const instruction = {
            kind: 'instructionNode',
            name: 'show',
            optionalAccountStrategy: 'programId',
            provides: [{ kind: 'providedNode', name: 'decimals', node: { kind: 'numberValueNode', number: 9 } }],
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({ identifier: 'show', provides: [providedNode('decimals', integerValueNode('9'))] }),
        );
    });

    test('it throws on provided nodes that are not instruction inputs', () => {
        const provided = { endian: 'le', format: 'u8', kind: 'numberTypeNode' };
        const instruction = {
            kind: 'instructionNode',
            name: 'show',
            provides: [{ kind: 'providedNode', name: 'size', node: provided }],
        } as unknown as v1.InstructionNode;
        expect(() => instructionNodeFromV1([...programPath, instruction])).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: [],
                kind: null,
                node: provided as never,
            }),
        );
    });
});

describe('arguments', () => {
    test('it turns arguments into the fields of the instruction data, typing their defaults', () => {
        const instruction = {
            arguments: [
                {
                    defaultValue: { kind: 'numberValueNode', number: 7 },
                    defaultValueStrategy: 'omitted',
                    docs: [],
                    kind: 'instructionArgumentNode',
                    name: 'discriminator',
                    type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                },
                {
                    defaultValue: { kind: 'numberValueNode', number: 1 },
                    docs: ['The ratio.'],
                    kind: 'instructionArgumentNode',
                    name: 'ratio',
                    type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'setRatio',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: integerValueNode('7'),
                        defaultValueStrategy: 'omitted',
                        identifier: 'discriminator',
                        type: integerTypeNode('u8'),
                    }),
                    structFieldTypeNode({
                        defaultValue: floatValueNode('1'),
                        docs: 'The ratio.',
                        identifier: 'ratio',
                        type: { endian: 'le', format: 'f64', kind: 'floatTypeNode' },
                    }),
                ]),
                identifier: 'setRatio',
            }),
        );
    });

    test('it provides contextual argument defaults, injected by the name of their argument', () => {
        const instruction = {
            arguments: [
                {
                    defaultValue: { kind: 'accountBumpValueNode', name: 'newAccount' },
                    kind: 'instructionArgumentNode',
                    name: 'bump',
                    type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                },
                {
                    defaultValue: { kind: 'identityValueNode' },
                    kind: 'instructionArgumentNode',
                    name: 'owner',
                    type: { kind: 'publicKeyTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'create',
            optionalAccountStrategy: 'programId',
            provides: [{ kind: 'providedNode', name: 'decimals', node: { kind: 'numberValueNode', number: 9 } }],
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: injectedValueNode({ key: 'bump' }),
                        identifier: 'bump',
                        type: integerTypeNode('u8'),
                    }),
                    structFieldTypeNode({
                        defaultValue: injectedValueNode({ key: 'owner' }),
                        identifier: 'owner',
                        type: publicKeyTypeNode(),
                    }),
                ]),
                identifier: 'create',
                provides: [
                    providedNode('decimals', integerValueNode('9')),
                    providedNode('bump', accountBumpValueNode('newAccount')),
                    providedNode('owner', identityValueNode()),
                ],
            }),
        );
    });

    test('it turns resolved argument defaults into resolver plugins', () => {
        const instruction = {
            arguments: [
                {
                    defaultValue: {
                        dependsOn: [
                            { kind: 'accountValueNode', name: 'authority' },
                            { kind: 'argumentValueNode', name: 'name' },
                        ],
                        docs: ['Derives tags', 'from the name.'],
                        kind: 'resolverValueNode',
                        name: 'resolveTags',
                    },
                    defaultValueStrategy: 'omitted',
                    kind: 'instructionArgumentNode',
                    name: 'tags',
                    type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'createItem',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;

        // Then the resolver keeps its docs, and the field keeps its default value strategy.
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValueStrategy: 'omitted',
                        identifier: 'tags',
                        plugins: [
                            pluginNode('codama.resolver', {
                                dependsOn: ['accounts.authority', 'data.name'],
                                docs: 'Derives tags\nfrom the name.',
                                name: 'resolveTags',
                            }),
                        ],
                        type: integerTypeNode('u8'),
                    }),
                ]),
                identifier: 'createItem',
            }),
        );
    });
});

describe('extra arguments', () => {
    test('it turns extra arguments into extra argument plugins', () => {
        const instruction = {
            extraArguments: [
                {
                    defaultValue: { kind: 'identityValueNode' },
                    defaultValueStrategy: 'omitted',
                    docs: ['The owner.'],
                    kind: 'instructionArgumentNode',
                    name: 'owner',
                    type: { kind: 'publicKeyTypeNode' },
                },
                {
                    kind: 'instructionArgumentNode',
                    name: 'standard',
                    type: { kind: 'definedTypeLinkNode', name: 'tokenStandard' },
                },
            ],
            kind: 'instructionNode',
            name: 'burn',
            optionalAccountStrategy: 'programId',
            plugins: [{ kind: 'pluginNode', name: 'explorerHints' }],
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                identifier: 'burn',
                plugins: [
                    pluginNode('explorerHints'),
                    pluginNode('codama.extraArgument', {
                        defaultValue: identityValueNode(),
                        defaultValueStrategy: 'omitted',
                        docs: 'The owner.',
                        identifier: 'owner',
                        type: publicKeyTypeNode(),
                    }),
                    pluginNode('codama.extraArgument', {
                        identifier: 'standard',
                        type: definedTypeLinkNode('tokenStandard'),
                    }),
                ],
            }),
        );
    });

    test('it resolves the defaults of extra arguments that v2 cannot express with nested resolver plugins, keeping their strategy', () => {
        const instruction = {
            extraArguments: [
                {
                    defaultValue: { kind: 'resolverValueNode', name: 'resolveOwner' },
                    defaultValueStrategy: 'omitted',
                    kind: 'instructionArgumentNode',
                    name: 'owner',
                    type: { kind: 'publicKeyTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'burn',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                identifier: 'burn',
                plugins: [
                    pluginNode(
                        'codama.extraArgument',
                        { defaultValueStrategy: 'omitted', identifier: 'owner', type: publicKeyTypeNode() },
                        { plugins: [pluginNode('codama.resolver', { name: 'resolveOwner' })] },
                    ),
                ],
            }),
        );
    });
});

describe('accounts', () => {
    test('it converts accounts and their contextual defaults', () => {
        const instruction = {
            accounts: [
                {
                    accountLink: { kind: 'accountLinkNode', name: 'config' },
                    defaultValue: { kind: 'payerValueNode' },
                    docs: ['The payer.'],
                    isOptional: false,
                    isSigner: 'either',
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'payer',
                },
                {
                    defaultValue: { account: 'payer', kind: 'accountFieldValueNode', path: 'authority' },
                    isOptional: true,
                    isSigner: false,
                    isWritable: false,
                    kind: 'instructionAccountNode',
                    name: 'authority',
                },
                {
                    defaultValue: { kind: 'argumentValueNode', name: 'destination' },
                    isOptional: false,
                    isSigner: false,
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'destination',
                },
                {
                    defaultValue: { kind: 'programLinkNode', name: 'token' },
                    isOptional: false,
                    isSigner: false,
                    isWritable: false,
                    kind: 'instructionAccountNode',
                    name: 'tokenProgram',
                },
            ],
            kind: 'instructionNode',
            name: 'transfer',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        accountLink: accountLinkNode('config'),
                        defaultValue: payerValueNode(),
                        docs: 'The payer.',
                        identifier: 'payer',
                        isSigner: 'either',
                        isWritable: true,
                    }),
                    instructionAccountNode({
                        defaultValue: accountDataValueNode('payer', { path: 'authority' }),
                        identifier: 'authority',
                        isOptional: true,
                        isSigner: false,
                        isWritable: false,
                    }),
                    instructionAccountNode({
                        defaultValue: dataValueNode('destination'),
                        identifier: 'destination',
                        isSigner: false,
                        isWritable: true,
                    }),
                    instructionAccountNode({
                        defaultValue: programLinkNode('token'),
                        identifier: 'tokenProgram',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                identifier: 'transfer',
            }),
        );
    });

    test('it types the seeds of PDA defaults with the seeds of their PDA', () => {
        const instruction = {
            accounts: [
                {
                    defaultValue: {
                        kind: 'pdaValueNode',
                        pda: { kind: 'pdaLinkNode', name: 'ratioPda' },
                        programId: { kind: 'argumentValueNode', name: 'program' },
                        seeds: [
                            { kind: 'pdaSeedValueNode', name: 'ratio', value: { kind: 'numberValueNode', number: 2 } },
                        ],
                    },
                    isOptional: false,
                    isSigner: false,
                    isWritable: false,
                    kind: 'instructionAccountNode',
                    name: 'vault',
                },
            ],
            kind: 'instructionNode',
            name: 'open',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode('ratioPda', {
                            programId: dataValueNode('program'),
                            seeds: [pdaSeedValueNode('ratio', floatValueNode('2'))],
                        }),
                        identifier: 'vault',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                identifier: 'open',
            }),
        );
    });

    test('it types the values of conditional defaults with the argument of their condition', () => {
        const instruction = {
            accounts: [
                {
                    defaultValue: {
                        condition: { kind: 'argumentValueNode', name: 'ratio' },
                        ifFalse: { kind: 'accountValueNode', name: 'authority' },
                        ifTrue: { kind: 'publicKeyValueNode', publicKey: '2222' },
                        kind: 'conditionalValueNode',
                        value: { kind: 'numberValueNode', number: 1 },
                    },
                    isOptional: false,
                    isSigner: false,
                    isWritable: false,
                    kind: 'instructionAccountNode',
                    name: 'target',
                },
            ],
            arguments: [
                {
                    kind: 'instructionArgumentNode',
                    name: 'ratio',
                    type: { endian: 'le', format: 'f32', kind: 'numberTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'pick',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: conditionalValueNode({
                            condition: dataValueNode('ratio'),
                            ifFalse: accountValueNode('authority'),
                            ifTrue: publicKeyValueNode('2222'),
                            value: floatValueNode('1'),
                        }),
                        identifier: 'target',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                data: structTypeNode([
                    structFieldTypeNode({
                        identifier: 'ratio',
                        type: { endian: 'le', format: 'f32', kind: 'floatTypeNode' },
                    }),
                ]),
                identifier: 'pick',
            }),
        );
    });

    test('it turns resolved account defaults into resolver plugins', () => {
        const instruction = {
            accounts: [
                {
                    defaultValue: { kind: 'resolverValueNode', name: 'resolveDestination' },
                    isOptional: false,
                    isSigner: false,
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'destination',
                },
            ],
            kind: 'instructionNode',
            name: 'transfer',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction])).toStrictEqual(
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        identifier: 'destination',
                        isSigner: false,
                        isWritable: true,
                        plugins: [pluginNode('codama.resolver', { name: 'resolveDestination' })],
                    }),
                ],
                identifier: 'transfer',
            }),
        );
    });

    test('it resolves account defaults relying on resolvers or extra arguments with new resolvers', () => {
        // Given defaults relying on a resolved condition and on an extra argument.
        const instruction = {
            accounts: [
                {
                    defaultValue: {
                        condition: {
                            dependsOn: [{ kind: 'accountValueNode', name: 'mint' }],
                            kind: 'resolverValueNode',
                            name: 'resolveIsNonFungible',
                        },
                        ifTrue: { kind: 'accountValueNode', name: 'mint' },
                        kind: 'conditionalValueNode',
                    },
                    isOptional: true,
                    isSigner: false,
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'edition',
                },
                {
                    defaultValue: {
                        condition: { kind: 'argumentValueNode', name: 'standard' },
                        ifTrue: { kind: 'accountBumpValueNode', name: 'token' },
                        kind: 'conditionalValueNode',
                        value: {
                            enum: { kind: 'definedTypeLinkNode', name: 'tokenStandard' },
                            kind: 'enumValueNode',
                            variant: 'programmable',
                        },
                    },
                    isOptional: true,
                    isSigner: false,
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'tokenRecord',
                },
            ],
            extraArguments: [
                {
                    kind: 'instructionArgumentNode',
                    name: 'standard',
                    type: { kind: 'definedTypeLinkNode', name: 'tokenStandard' },
                },
            ],
            kind: 'instructionNode',
            name: 'burn',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;

        // Then both defaults are resolved by new resolvers depending on everything they relied on.
        expect(instructionNodeFromV1([...programPath, instruction]).accounts).toStrictEqual([
            instructionAccountNode({
                identifier: 'edition',
                isOptional: true,
                isSigner: false,
                isWritable: true,
                plugins: [pluginNode('codama.resolver', { dependsOn: ['accounts.mint'], name: 'resolveBurnEdition' })],
            }),
            instructionAccountNode({
                identifier: 'tokenRecord',
                isOptional: true,
                isSigner: false,
                isWritable: true,
                plugins: [
                    pluginNode('codama.resolver', {
                        dependsOn: ['data.standard', 'accounts.token'],
                        name: 'resolveBurnTokenRecord',
                    }),
                ],
            }),
        ]);
    });

    test('it keeps conditional defaults relying on regular arguments', () => {
        const instruction = {
            accounts: [
                {
                    defaultValue: {
                        condition: { kind: 'argumentValueNode', name: 'standard' },
                        ifTrue: { kind: 'accountValueNode', name: 'mint' },
                        kind: 'conditionalValueNode',
                        value: {
                            enum: { kind: 'definedTypeLinkNode', name: 'tokenStandard' },
                            kind: 'enumValueNode',
                            variant: 'programmable',
                        },
                    },
                    isOptional: true,
                    isSigner: false,
                    isWritable: true,
                    kind: 'instructionAccountNode',
                    name: 'tokenRecord',
                },
            ],
            arguments: [
                {
                    kind: 'instructionArgumentNode',
                    name: 'standard',
                    type: { kind: 'definedTypeLinkNode', name: 'tokenStandard' },
                },
            ],
            kind: 'instructionNode',
            name: 'burn',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction]).accounts).toStrictEqual([
            instructionAccountNode({
                defaultValue: conditionalValueNode({
                    condition: dataValueNode('standard'),
                    ifTrue: accountValueNode('mint'),
                    value: enumValueNode('tokenStandard', 'programmable'),
                }),
                identifier: 'tokenRecord',
                isOptional: true,
                isSigner: false,
                isWritable: true,
            }),
        ]);
    });
});

describe('remaining accounts', () => {
    test('it identifies remaining accounts by their argument, or as resolved remaining accounts', () => {
        const instruction = {
            kind: 'instructionNode',
            name: 'transfer',
            optionalAccountStrategy: 'programId',
            remainingAccounts: [
                {
                    docs: ['The signers.'],
                    isOptional: true,
                    isSigner: true,
                    kind: 'instructionRemainingAccountsNode',
                    value: { kind: 'argumentValueNode', name: 'signers' },
                },
                {
                    kind: 'instructionRemainingAccountsNode',
                    value: { kind: 'resolverValueNode', name: 'resolveHooks' },
                },
                {
                    isWritable: true,
                    kind: 'instructionRemainingAccountsNode',
                    value: {
                        dependsOn: [{ kind: 'argumentValueNode', name: 'amount' }],
                        kind: 'resolverValueNode',
                        name: 'resolveExtras',
                    },
                },
            ],
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction]).remainingAccounts).toStrictEqual([
            instructionRemainingAccountsNode('signers', { docs: 'The signers.', isOptional: true, isSigner: true }),
            instructionRemainingAccountsNode('remainingAccounts', {
                plugins: [pluginNode('codama.resolver', { name: 'resolveHooks' })],
            }),
            instructionRemainingAccountsNode('remainingAccounts1', {
                isWritable: true,
                plugins: [pluginNode('codama.resolver', { dependsOn: ['data.amount'], name: 'resolveExtras' })],
            }),
        ]);
    });
});

describe('byte deltas', () => {
    test('it converts byte deltas, resolving those v2 cannot express', () => {
        const instruction = {
            byteDeltas: [
                { kind: 'instructionByteDeltaNode', value: { kind: 'numberValueNode', number: 42 }, withHeader: true },
                {
                    kind: 'instructionByteDeltaNode',
                    subtract: true,
                    value: { kind: 'argumentValueNode', name: 'space' },
                    withHeader: false,
                },
                {
                    kind: 'instructionByteDeltaNode',
                    value: { kind: 'accountLinkNode', name: 'mint' },
                    withHeader: true,
                },
                {
                    kind: 'instructionByteDeltaNode',
                    value: { kind: 'resolverValueNode', name: 'resolveBytes' },
                    withHeader: false,
                },
                {
                    kind: 'instructionByteDeltaNode',
                    value: { kind: 'argumentValueNode', name: 'extraSpace' },
                    withHeader: false,
                },
            ],
            extraArguments: [
                {
                    kind: 'instructionArgumentNode',
                    name: 'extraSpace',
                    type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                },
            ],
            kind: 'instructionNode',
            name: 'create',
            optionalAccountStrategy: 'programId',
        } as unknown as v1.InstructionNode;
        expect(instructionNodeFromV1([...programPath, instruction]).byteDeltas).toStrictEqual([
            instructionByteDeltaNode(integerValueNode('42'), { withHeader: true }),
            instructionByteDeltaNode(dataValueNode('space'), { subtract: true, withHeader: false }),
            instructionByteDeltaNode(accountLinkNode('mint'), { withHeader: true }),
            instructionByteDeltaNode(integerValueNode('0'), {
                plugins: [pluginNode('codama.resolver', { name: 'resolveBytes' })],
                withHeader: false,
            }),
            instructionByteDeltaNode(integerValueNode('0'), {
                plugins: [
                    pluginNode('codama.resolver', { dependsOn: ['data.extraSpace'], name: 'resolveCreateByteDelta4' }),
                ],
                withHeader: false,
            }),
        ]);
    });
});
