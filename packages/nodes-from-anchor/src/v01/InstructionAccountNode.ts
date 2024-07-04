import {
    KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    KinobiError,
} from '@kinobi-so/errors';
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
} from '@kinobi-so/nodes';

import { hex } from '../utils';
import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Seed } from './idl';

export function instructionAccountNodesFromAnchorV01(
    types: AccountNode[],
    args: InstructionArgumentNode[],
    idl: IdlV01InstructionAccountItem[],
): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(types, args, account.accounts)
            : [instructionAccountNodeFromAnchorV01(types, args, account)],
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
                            const [_, field] = path;
                            const name = camelCase(seed.account ?? '');
                            const accountNode = allAccounts.find(type => type.name === name);
                            if (!accountNode) {
                                throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
                            }

                            const accountFields = resolveNestedTypeNode(accountNode.data).fields;
                            const camelCaseField = camelCase(field);
                            const fieldNode = accountFields.find(({ name }) => name === camelCaseField);
                            if (!fieldNode) {
                                throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
                            }

                            return [[...seeds, variablePdaSeedNode(seed.path, fieldNode.type)], lookups];
                        } else {
                            throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
                        }
                    }
                    case 'arg': {
                        const argumentNode = instructionArguments.find(({ name }) => name === seed.path);
                        if (!argumentNode) {
                            throw new KinobiError(KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: seed.path });
                        }

                        return [
                            [...seeds, variablePdaSeedNode(seed.path, argumentNode.type)],
                            [...lookups, pdaSeedValueNode(seed.path, argumentValueNode(seed.path))],
                        ];
                    }
                    default:
                        throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
                }
            },
            <[PdaSeedNode[], PdaSeedValueNode[]]>[[], []],
        );

        defaultValue = pdaValueNode(pdaNode({ name, seeds }), lookups);
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
