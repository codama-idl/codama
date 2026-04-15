import { logWarn } from '@codama/errors';
import {
    AccountValueNode,
    ArgumentValueNode,
    camelCase,
    InstructionAccountNode,
    instructionAccountNode,
    InstructionArgumentNode,
    isNode,
    pdaNode,
    PdaValueNode,
    pdaValueNode,
    PublicKeyValueNode,
    publicKeyValueNode,
} from '@codama/nodes';

import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01TypeDef } from './idl';
import { pdaSeedNodeFromAnchorV01 } from './PdaSeedNode';
import type { GenericsV01 } from './unwrapGenerics';

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
    idlTypes: IdlV01TypeDef[] = [],
    generics: GenericsV01 = { constArgs: {}, typeArgs: {}, types: {} },
): InstructionAccountNode[] {
    const shouldPrefix = prefix !== undefined || hasDuplicateAccountNames(idl);

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(
                  account.accounts,
                  instructionArguments,
                  shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
                  idlTypes,
                  generics,
              )
            : [
                  instructionAccountNodeFromAnchorV01(
                      account,
                      instructionArguments,
                      shouldPrefix ? prefix : undefined,
                      idlTypes,
                      generics,
                  ),
              ],
    );
}

export function instructionAccountNodeFromAnchorV01(
    idl: IdlV01InstructionAccount,
    instructionArguments: InstructionArgumentNode[],
    prefix?: string,
    idlTypes: IdlV01TypeDef[] = [],
    generics: GenericsV01 = { constArgs: {}, typeArgs: {}, types: {} },
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
        const seedResults = idl.pda.seeds.map(seed =>
            pdaSeedNodeFromAnchorV01(seed, instructionArguments, prefix, idlTypes, generics),
        );

        if (seedResults.every((r): r is NonNullable<typeof r> => r != null)) {
            const seedDefinitions = seedResults.map(r => r.definition);
            const seedValues = seedResults.flatMap(r => (r.value ? [r.value] : []));

            let programId: string | undefined;
            let programIdValue: AccountValueNode | ArgumentValueNode | undefined;
            if (idl.pda.program !== undefined) {
                const result = pdaSeedNodeFromAnchorV01(
                    idl.pda.program,
                    instructionArguments,
                    prefix,
                    idlTypes,
                    generics,
                );
                if (!result) {
                    logWarn(`Skipping PDA for account "${name}": program seed could not be resolved.`);
                    return instructionAccountNode({ defaultValue, docs, isOptional, isSigner, isWritable, name });
                }
                if (
                    isNode(result.definition, 'constantPdaSeedNode') &&
                    isNode(result.definition.value, 'bytesValueNode') &&
                    result.definition.value.encoding === 'base58'
                ) {
                    programId = result.definition.value.data;
                } else if (result.value && isNode(result.value.value, ['accountValueNode', 'argumentValueNode'])) {
                    programIdValue = result.value.value;
                }
            }

            const camelName = camelCase(name);
            const isSelfReferential =
                seedValues.some(sv => isNode(sv.value, 'accountValueNode') && sv.value.name === camelName) ||
                (programIdValue != null &&
                    isNode(programIdValue, 'accountValueNode') &&
                    programIdValue.name === camelName);
            if (isSelfReferential) {
                logWarn(`Skipping PDA for account "${name}": a seed references the account itself.`);
            }
            if (!isSelfReferential) {
                defaultValue = pdaValueNode(
                    pdaNode({ name, programId, seeds: seedDefinitions }),
                    seedValues,
                    programIdValue,
                );
            }
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
