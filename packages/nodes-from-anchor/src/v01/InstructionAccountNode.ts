import { camelCase } from '@codama/fragments/casing';
import {
    AccountValueNode,
    DataValueNode,
    InstructionAccountNode,
    instructionAccountNode,
    isNode,
    pdaNode,
    PdaValueNode,
    pdaValueNode,
    publicKeyValueNode,
    StructFieldTypeNode,
} from '@codama/nodes';

import { anchorRelationsPluginNode, docsFromAnchor } from '../utils';
import { IdlV01InstructionAccount, IdlV01InstructionAccountItem, IdlV01Pda } from './idl';
import { pdaSeedNodeFromAnchorV01, PdaSeedNodeFromAnchorV01Options } from './PdaSeedNode';

/**
 * Whether flattening nested account groups would produce accounts whose
 * identifiers collide under the casing-collision rule, in which case
 * nested accounts are prefixed by their group identifiers.
 */
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

export type InstructionAccountNodeFromAnchorV01Options = PdaSeedNodeFromAnchorV01Options;

export function instructionAccountNodesFromAnchorV01(
    idl: IdlV01InstructionAccountItem[],
    dataFields: StructFieldTypeNode[],
    options: InstructionAccountNodeFromAnchorV01Options = {},
): InstructionAccountNode[] {
    const { prefix } = options;
    const shouldPrefix = prefix !== undefined || hasDuplicateAccountNames(idl);

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(account.accounts, dataFields, {
                  ...options,
                  prefix: shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
              })
            : [
                  instructionAccountNodeFromAnchorV01(account, dataFields, {
                      ...options,
                      prefix: shouldPrefix ? prefix : undefined,
                  }),
              ],
    );
}

/**
 * Convert an Anchor instruction account, including its fixed address or
 * PDA default value, and its `relations` as an `anchor.relations` plugin.
 *
 * A PDA default value is only set when all of its seeds can be expressed
 * statically (see `pdaSeedNodeFromAnchorV01`).
 */
export function instructionAccountNodeFromAnchorV01(
    idl: IdlV01InstructionAccount,
    dataFields: StructFieldTypeNode[],
    options: InstructionAccountNodeFromAnchorV01Options = {},
): InstructionAccountNode {
    const { prefix } = options;
    const withPrefix = (accountName: string) => (prefix ? `${prefix}_${accountName}` : accountName);
    const name = withPrefix(idl.name ?? '');

    return instructionAccountNode({
        defaultValue: idl.address
            ? publicKeyValueNode(idl.address, { identifier: name })
            : idl.pda
              ? pdaDefaultValueFromAnchorV01(name, idl.pda, dataFields, options)
              : undefined,
        docs: docsFromAnchor(idl.docs),
        identifier: name,
        isOptional: idl.optional ?? false,
        isSigner: idl.signer ?? false,
        isWritable: idl.writable ?? false,
        // Relations are siblings within the same account group.
        plugins: anchorRelationsPluginNode((idl.relations ?? []).map(withPrefix)),
    });
}

function pdaDefaultValueFromAnchorV01(
    name: string,
    pda: IdlV01Pda,
    dataFields: StructFieldTypeNode[],
    options: InstructionAccountNodeFromAnchorV01Options,
): PdaValueNode | undefined {
    const seeds = pda.seeds.map(seed => pdaSeedNodeFromAnchorV01(seed, dataFields, options));
    if (seeds.some(seed => seed === undefined)) return undefined;
    const seedDefinitions = seeds.map(seed => seed!.definition);
    const seedValues = seeds.flatMap(seed => (seed!.value ? [seed!.value] : []));

    let programId: string | undefined;
    let programIdValue: AccountValueNode | DataValueNode | undefined;
    if (pda.program !== undefined) {
        const program = pdaSeedNodeFromAnchorV01(pda.program, dataFields, options);
        if (!program) return undefined;
        const { definition, value } = program;
        if (
            isNode(definition, 'constantPdaSeedNode') &&
            isNode(definition.value, 'bytesValueNode') &&
            definition.value.encoding === 'base58'
        ) {
            programId = definition.value.data;
        } else if (value && isNode(value.value, ['accountValueNode', 'dataValueNode'])) {
            programIdValue = value.value;
        }
    }

    return pdaValueNode(pdaNode({ identifier: name, programId, seeds: seedDefinitions }), {
        programId: programIdValue,
        seeds: seedValues,
    });
}
