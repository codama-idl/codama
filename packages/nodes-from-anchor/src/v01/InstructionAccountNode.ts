import { KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, KinobiError } from '@kinobi-so/errors';
import {
    AccountNode,
    accountValueNode,
    argumentValueNode,
    camelCase,
    constantPdaSeedNodeFromBytes,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionArgumentNode,
    InstructionInputValueNode,
    NestedTypeNode,
    PdaLinkNode,
    pdaNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    RegisteredDiscriminatorNode,
    StandaloneValueNode,
    StructFieldTypeNode,
    StructTypeNode,
    TypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';

import { hex } from '../utils';
import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Seed } from './idl';

type AccountNodeList = AccountNode<
    NestedTypeNode<StructTypeNode<StructFieldTypeNode<TypeNode, StandaloneValueNode | undefined>[]>>,
    PdaLinkNode | undefined,
    RegisteredDiscriminatorNode[] | undefined
>[];

export function instructionAccountNodesFromAnchorV01(
    types: AccountNodeList,
    args: InstructionArgumentNode<InstructionInputValueNode | undefined>[],
    idl: IdlV01InstructionAccountItem[],
): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(types, args, account.accounts)
            : [instructionAccountNodeFromAnchorV01(types, args, account)],
    );
}

export function instructionAccountNodeFromAnchorV01(
    types: AccountNodeList,
    args: InstructionArgumentNode<InstructionInputValueNode | undefined>[],
    idl: IdlV01InstructionAccount,
): InstructionAccountNode {
    const isOptional = idl.optional ?? false;
    const docs = idl.docs ?? [];
    const isSigner = idl.signer ?? false;
    const isWritable = idl.writable ?? false;
    const name = idl.name ?? '';
    let defaultValue = undefined;

    if (idl.address) {
        defaultValue = publicKeyValueNode(idl.address, name);
    }

    if (idl.pda) {
        const [seeds, lookups] = idl.pda.seeds.reduce(
            ([seeds, lookups], seed: IdlV01Seed) => {
                const kind = seed.kind;

                switch (kind) {
                    case 'const':
                        return [[...seeds, constantPdaSeedNodeFromBytes('base16', hex(seed.value))], lookups];
                    case 'account': {
                        const path = seed.path.split('.');
                        const length = path.length;

                        if (length === 1) {
                            return [
                                [...seeds, variablePdaSeedNode(seed.path, publicKeyTypeNode())],
                                [...lookups, pdaSeedValueNode(seed.path, accountValueNode(seed.path))],
                            ];
                        } else if (length === 2) {
                            const [_, field] = path;
                            const name = camelCase(seed.account as string);
                            const accountNode = types.find(type => type.name === name);

                            if (!accountNode) {
                                throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, {
                                    kind,
                                });
                            }

                            if (!('data' in accountNode && 'fields' in accountNode.data)) {
                                throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, {
                                    kind,
                                });
                            }

                            const fieldTypeNodes = accountNode.data.fields;
                            const camelCaseField = camelCase(field);

                            const fieldType = fieldTypeNodes.find(fieldType => fieldType.name === camelCaseField);

                            if (!fieldType) {
                                throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, {
                                    kind,
                                });
                            }

                            return [[...seeds, variablePdaSeedNode(seed.path, fieldType.type)], lookups];
                        } else {
                            throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, {
                                kind,
                            });
                        }
                    }
                    case 'arg': {
                        const arg = args.find(arg => arg.name === seed.path) as InstructionArgumentNode<
                            InstructionInputValueNode | undefined
                        >;

                        return [
                            [...seeds, variablePdaSeedNode(seed.path, arg.type)],
                            [...lookups, pdaSeedValueNode(seed.path, argumentValueNode(seed.path))],
                        ];
                    }
                    default:
                        throw new KinobiError(KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, {
                            kind,
                        });
                }
            },
            <[PdaSeedNode[], PdaSeedValueNode[]]>[[], []],
        );

        defaultValue = pdaValueNode(
            pdaNode({
                name,
                seeds,
            }),
            lookups,
        );
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
