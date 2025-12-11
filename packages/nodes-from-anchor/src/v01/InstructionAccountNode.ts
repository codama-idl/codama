import {
    AccountValueNode,
    ArgumentValueNode,
    camelCase,
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

function hasDuplicateAccountNames(idl: IdlV01InstructionAccountItem[]): boolean {
    const seenNames = new Set<string>();

    function checkDuplicates(items: IdlV01InstructionAccountItem[]): boolean {
        for (const item of items) {
            if ('accounts' in item) {
                if (checkDuplicates(item.accounts)) {
                    return true;
                }
            } else {
                const name = camelCase(item.name ?? '');
                if (seenNames.has(name)) {
                    return true;
                }
                seenNames.add(name);
            }
        }
        return false;
    }

    return checkDuplicates(idl);
}

export function instructionAccountNodesFromAnchorV01(
    idl: IdlV01InstructionAccountItem[],
    instructionArguments: InstructionArgumentNode[],
    prefix?: string,
): InstructionAccountNode[] {
    const hasDuplicates = hasDuplicateAccountNames(idl);
    const shouldPrefix = prefix !== undefined || hasDuplicates;

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(
                  account.accounts,
                  instructionArguments,
                  shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
              )
            : [instructionAccountNodeFromAnchorV01(account, instructionArguments, shouldPrefix ? prefix : undefined)],
    );
}

export function instructionAccountNodeFromAnchorV01(
    idl: IdlV01InstructionAccount,
    instructionArguments: InstructionArgumentNode[],
    prefix?: string,
): InstructionAccountNode {
    const isOptional = idl.optional ?? false;
    const docs = idl.docs ?? [];
    const isSigner = idl.signer ?? false;
    const isWritable = idl.writable ?? false;
    const name = prefix ? `${prefix}_${idl.name ?? ''}` : (idl.name ?? '');
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
                    const { definition, value } = pdaSeedNodeFromAnchorV01(seed, instructionArguments, prefix);
                    return [[...seeds, definition], value ? [...lookups, value] : lookups];
                },
                <[PdaSeedNode[], PdaSeedValueNode[]]>[[], []],
            );

            let programId: string | undefined;
            let programIdValue: AccountValueNode | ArgumentValueNode | undefined;
            if (idl.pda.program !== undefined) {
                const { definition, value } = pdaSeedNodeFromAnchorV01(idl.pda.program, instructionArguments, prefix);
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
