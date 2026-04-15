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
    PdaSeedNode,
    PdaSeedValueNode,
    PdaValueNode,
    pdaValueNode,
    PublicKeyValueNode,
    publicKeyValueNode,
} from '@codama/nodes';

import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Pda, IdlV01Seed, IdlV01TypeDef } from './idl';
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
        defaultValue = resolvePdaDefaultValue(idl.pda, name, instructionArguments, prefix, idlTypes, generics);
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

function resolvePdaDefaultValue(
    pda: IdlV01Pda,
    name: string,
    instructionArguments: InstructionArgumentNode[],
    prefix: string | undefined,
    idlTypes: IdlV01TypeDef[],
    generics: GenericsV01,
): PdaValueNode | undefined {
    const seeds = resolveSeeds(pda.seeds, instructionArguments, prefix, idlTypes, generics);
    if (!seeds) return undefined;

    let programId: string | undefined;
    let programValue: AccountValueNode | ArgumentValueNode | undefined;
    if (pda.program) {
        const result = resolveProgramSeed(pda.program, name, instructionArguments, prefix, idlTypes, generics);
        if (!result) return undefined;
        programId = result.id;
        programValue = result.value;
    }

    const camelName = camelCase(name);
    const isSelfReferential =
        seeds.values.some(sv => isNode(sv.value, 'accountValueNode') && sv.value.name === camelName) ||
        (programValue != null && isNode(programValue, 'accountValueNode') && programValue.name === camelName);
    if (isSelfReferential) {
        logWarn(`Skipping PDA for account "${name}": a seed references the account itself.`);
        return undefined;
    }

    return pdaValueNode(pdaNode({ name, programId, seeds: seeds.definitions }), seeds.values, programValue);
}

function resolveSeeds(
    seeds: IdlV01Seed[],
    instructionArguments: InstructionArgumentNode[],
    prefix: string | undefined,
    idlTypes: IdlV01TypeDef[],
    generics: GenericsV01,
): { definitions: PdaSeedNode[]; values: PdaSeedValueNode[] } | undefined {
    const results = seeds.map(seed => pdaSeedNodeFromAnchorV01(seed, instructionArguments, prefix, idlTypes, generics));
    if (!results.every((r): r is NonNullable<typeof r> => r != null)) {
        return undefined;
    }
    return {
        definitions: results.map(r => r.definition),
        values: results.flatMap(r => (r.value ? [r.value] : [])),
    };
}

function resolveProgramSeed(
    program: IdlV01Seed,
    name: string,
    instructionArguments: InstructionArgumentNode[],
    prefix: string | undefined,
    idlTypes: IdlV01TypeDef[],
    generics: GenericsV01,
): { id?: string; value?: AccountValueNode | ArgumentValueNode } | undefined {
    const result = pdaSeedNodeFromAnchorV01(program, instructionArguments, prefix, idlTypes, generics);
    if (!result) {
        logWarn(`Skipping PDA for account "${name}": program seed could not be resolved.`);
        return undefined;
    }

    if (
        isNode(result.definition, 'constantPdaSeedNode') &&
        isNode(result.definition.value, 'bytesValueNode') &&
        result.definition.value.encoding === 'base58'
    ) {
        return { id: result.definition.value.data };
    }

    if (result.value && isNode(result.value.value, ['accountValueNode', 'argumentValueNode'])) {
        return { value: result.value.value };
    }

    return {};
}
