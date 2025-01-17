import {
    CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING,
    CodamaError,
} from '@codama/errors';
import {
    AccountNode,
    accountValueNode,
    argumentValueNode,
    camelCase,
    constantPdaSeedNodeFromBytes,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionArgumentNode,
    pdaNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    PdaValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    PublicKeyValueNode,
    publicKeyValueNode,
    resolveNestedTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getBase58Codec } from '@solana/codecs';

import { hex } from '../utils';
import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Seed } from './idl';

export function instructionAccountNodesFromAnchorV01(
    allAccounts: AccountNode[],
    instructionArguments: InstructionArgumentNode[],
    idl: IdlV01InstructionAccountItem[],
): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(allAccounts, instructionArguments, account.accounts)
            : [instructionAccountNodeFromAnchorV01(allAccounts, instructionArguments, account)],
    );
}

export function instructionAccountNodeFromAnchorV01(
    allAccounts: AccountNode[],
    instructionArguments: InstructionArgumentNode[],
    idl: IdlV01InstructionAccount,
): InstructionAccountNode {
    const isOptional = idl.optional ?? false;
    const docs = idl.docs ?? [];
    const isSigner = idl.signer ?? false;
    const isWritable = idl.writable ?? false;
    const name = idl.name ?? '';
    let defaultValue: PdaValueNode | PublicKeyValueNode | undefined;

    if (idl.address) {
        defaultValue = publicKeyValueNode(idl.address, name);
    } else if (idl.pda) {
        // TODO: Handle seeds with nested paths.
        // Currently, we gracefully ignore PDA default values if we encounter seeds with nested paths.
        const seedsWithNestedPaths = idl.pda.seeds.some(seed => 'path' in seed && seed.path.includes('.'));
        if (!seedsWithNestedPaths) {
            const [seeds, lookups] = idl.pda.seeds.reduce(
                ([seeds, lookups], seed: IdlV01Seed) => {
                    const kind = seed.kind;

                    switch (kind) {
                        case 'const':
                            return [[...seeds, constantPdaSeedNodeFromBytes('base16', hex(seed.value))], lookups];
                        case 'account': {
                            const path = seed.path.split('.');
                            if (path.length === 1) {
                                return [
                                    [...seeds, variablePdaSeedNode(seed.path, publicKeyTypeNode())],
                                    [...lookups, pdaSeedValueNode(seed.path, accountValueNode(seed.path))],
                                ];
                            } else if (path.length === 2) {
                                // TODO: Handle nested account paths.
                                // Currently, this scenario is never reached.

                                const accountName = camelCase(seed.account ?? '');
                                const accountNode = allAccounts.find(({ name }) => name === accountName);
                                if (!accountNode) {
                                    throw new CodamaError(CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, { kind });
                                }

                                const fieldName = camelCase(path[1]);
                                const accountFields = resolveNestedTypeNode(accountNode.data).fields;
                                const fieldNode = accountFields.find(({ name }) => name === fieldName);
                                if (!fieldNode) {
                                    throw new CodamaError(CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING, {
                                        idlType: seed.account,
                                        path: seed.path,
                                    });
                                }

                                const seedName = camelCase(seed.path);
                                return [[...seeds, variablePdaSeedNode(seedName, fieldNode.type)], []];
                            } else {
                                throw new CodamaError(CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING, {
                                    idlType: seed,
                                    path: seed.path,
                                });
                            }
                        }
                        case 'arg': {
                            const argumentName = camelCase(seed.path);
                            const argumentNode = instructionArguments.find(({ name }) => name === argumentName);
                            if (!argumentNode) {
                                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: seed.path });
                            }

                            return [
                                [...seeds, variablePdaSeedNode(seed.path, argumentNode.type)],
                                [...lookups, pdaSeedValueNode(seed.path, argumentValueNode(seed.path))],
                            ];
                        }
                        default:
                            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
                    }
                },
                <[PdaSeedNode[], PdaSeedValueNode[]]>[[], []],
            );

            let programId: string | undefined;
            if (idl.pda.program !== undefined) {
                const kind = idl.pda.program.kind;
                switch (kind) {
                    case 'const': {
                        programId = getBase58Codec().decode(new Uint8Array(idl.pda.program.value));
                        break;
                    }
                    default: {
                        throw new CodamaError(CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED, { kind });
                    }
                }
            }

            defaultValue = pdaValueNode(
                pdaNode({ name, seeds, ...(programId !== undefined ? { programId } : {}) }),
                lookups,
            );
        }
    }

    return instructionAccountNode({
        defaultValue,
        docs,
        isOptional,
        isSigner,
        isWritable,
        name,
    });
}
