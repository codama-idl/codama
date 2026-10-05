import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__UNSUPPORTED_VERSION,
    CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    CODAMA_ERROR__VERSION_MISMATCH,
    CodamaError,
} from '@codama/errors';
import {
    AccountValueNode,
    CODAMA_VERSION,
    CodamaVersion,
    PdaSeedValueNode,
    PdaValueNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { getValidationItemsVisitor } from '@codama/validators';
import { visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { upgrade, UpgradableRootNode, upgradeV1ToV2, type v1 } from '../src';

const program = programNode({ identifier: 'myProgram', publicKey: '1111', version: '1.0.0' });

function rootNodeWithVersion(version: string) {
    return { ...rootNode(program), version: version as CodamaVersion };
}

describe('upgrade', () => {
    test('it restamps IDLs of the latest major with the latest spec version', () => {
        const upgraded = upgrade(rootNodeWithVersion('2.0.0'));
        expect(upgraded.version).toBe(CODAMA_VERSION);
    });

    test('it preserves the IDL content', () => {
        const upgraded = upgrade(rootNodeWithVersion('2.4.2'));
        expect(upgraded).toEqual({ ...rootNode(program), version: CODAMA_VERSION });
    });

    test('it returns a frozen IDL', () => {
        expect(Object.isFrozen(upgrade(rootNode(program)))).toBe(true);
    });

    test('it upgrades v1 IDLs to the latest major', () => {
        const v1Root = {
            kind: 'rootNode',
            program: { kind: 'programNode', name: 'myProgram', origin: 'shank', publicKey: '1111', version: '1.0.0' },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as UpgradableRootNode;
        const upgraded = upgrade(v1Root);
        expect(upgraded).toStrictEqual(rootNode(program));
        expect(Object.isFrozen(upgraded.program)).toBe(true);
    });

    test('it exposes the v1 to v2 step, stamped with the latest v2 version', () => {
        const v1Root = {
            kind: 'rootNode',
            program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const upgraded = upgradeV1ToV2(v1Root);
        expect(upgraded).toStrictEqual(rootNode(program));
        expect(upgraded.version).toBe(CODAMA_VERSION);
        expect(Object.isFrozen(upgraded)).toBe(true);
    });

    test('it refuses pre-1.0 IDLs', () => {
        expect(() => upgrade(rootNodeWithVersion('0.21.3'))).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: '0.21.3' }),
        );
    });

    test('it refuses IDLs with unparsable versions', () => {
        expect(() => upgrade(rootNodeWithVersion('not-a-version'))).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: 'not-a-version' }),
        );
    });

    test('it refuses IDLs with no version', () => {
        const versionlessRoot: Record<string, unknown> = { ...rootNode(program) };
        delete versionlessRoot.version;
        expect(() => upgrade(versionlessRoot as unknown as UpgradableRootNode)).toThrow(
            new CodamaError(CODAMA_ERROR__UNSUPPORTED_VERSION, { version: '' }),
        );
    });

    test('it refuses IDLs from a future major', () => {
        expect(() => upgrade(rootNodeWithVersion('3.4.2'))).toThrow(
            new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '3.4.2' }),
        );
    });

    test('it refuses inputs that are not root nodes', () => {
        expect(() => upgrade(program as unknown as UpgradableRootNode)).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: ['rootNode'],
                kind: 'programNode',
                node: program,
            }),
        );
    });

    test('it reports optional resolved accounts used as PDA seeds, which v1 considered resolved', () => {
        // Given a v1 instruction whose optional account is resolved, and used as a PDA seed.
        const v1Root = {
            kind: 'rootNode',
            program: {
                instructions: [
                    {
                        accounts: [
                            {
                                defaultValue: { kind: 'resolverValueNode', name: 'resolveOwner' },
                                isOptional: true,
                                isSigner: false,
                                isWritable: false,
                                kind: 'instructionAccountNode',
                                name: 'owner',
                            },
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: { kind: 'pdaLinkNode', name: 'vault' },
                                    seeds: [
                                        {
                                            kind: 'pdaSeedValueNode',
                                            name: 'owner',
                                            value: { kind: 'accountValueNode', name: 'owner' },
                                        },
                                    ],
                                },
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                kind: 'instructionAccountNode',
                                name: 'vault',
                            },
                        ],
                        kind: 'instructionNode',
                        name: 'open',
                        optionalAccountStrategy: 'programId',
                    },
                ],
                kind: 'programNode',
                name: 'myProgram',
                pdas: [
                    {
                        kind: 'pdaNode',
                        name: 'vault',
                        seeds: [{ kind: 'variablePdaSeedNode', name: 'owner', type: { kind: 'publicKeyTypeNode' } }],
                    },
                ],
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as UpgradableRootNode;

        // When we upgrade and validate it.
        const upgraded = upgrade(v1Root);
        const items = visit(upgraded, getValidationItemsVisitor()).filter(item => item.level === 'error');

        // Then validators no longer see the account as resolved, since its resolver is now a plugin.
        const instruction = upgraded.program.instructions![0];
        const [, vault] = instruction.accounts!;
        const seed = (vault.defaultValue as PdaValueNode).seeds![0];
        expect(items.map(item => item.cause ?? item.message)).toStrictEqual([
            new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE, {
                instruction,
                instructionAccount: vault,
                instructionAccountName: vault.identifier,
                instructionName: instruction.identifier,
                seed: seed as PdaSeedValueNode<AccountValueNode>,
                seedName: seed.identifier,
                seedValueName: (seed.value as AccountValueNode).identifier,
            }),
        ]);
    });
});
