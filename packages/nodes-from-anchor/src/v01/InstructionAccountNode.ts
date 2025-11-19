import {
    AccountValueNode,
    ArgumentValueNode,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionArgumentNode,
    isNode,
    pdaNode,
    PdaSeedNode,
    PdaSeedValueNode,
    PdaValueNode,
    pdaValueNode,
    PublicKeyValueNode,
    publicKeyValueNode,
} from '@codama/nodes';

import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Seed } from './idl';
import { pdaSeedNodeFromAnchorV01 } from './PdaSeedNode';

export function instructionAccountNodesFromAnchorV01(
    idl: IdlV01InstructionAccountItem[],
    instructionArguments: InstructionArgumentNode[],
): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(account.accounts, instructionArguments)
            : [instructionAccountNodeFromAnchorV01(account, instructionArguments)],
    );
}

export function instructionAccountNodeFromAnchorV01(
    idl: IdlV01InstructionAccount,
    instructionArguments: InstructionArgumentNode[],
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
            const [seedDefinitions, seedValues] = idl.pda.seeds.reduce(
                ([seeds, lookups], seed: IdlV01Seed) => {
                    const { definition, value } = pdaSeedNodeFromAnchorV01(seed, instructionArguments);
                    return [[...seeds, definition], value ? [...lookups, value] : lookups];
                },
                <[PdaSeedNode[], PdaSeedValueNode[]]>[[], []],
            );

            let programId: string | undefined;
            let programIdValue: AccountValueNode | ArgumentValueNode | undefined;
            if (idl.pda.program !== undefined) {
                const { definition, value } = pdaSeedNodeFromAnchorV01(idl.pda.program, instructionArguments);
                if (
                    isNode(definition, 'constantPdaSeedNode') &&
                    isNode(definition.value, 'bytesValueNode') &&
                    definition.value.encoding === 'base58'
                ) {
                    programId = definition.value.data;
                } else if (value && isNode(value.value, ['accountValueNode', 'argumentValueNode'])) {
                    programIdValue = value.value;
                }
            }

            defaultValue = pdaValueNode(
                pdaNode({ name, programId, seeds: seedDefinitions }),
                seedValues,
                programIdValue,
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
