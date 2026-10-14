import {
    type FormattedInstructionNode,
    type FormattedStructFieldTypeNode,
    type FormattedTypeNode,
    type FormatOptions,
    getValueLabel,
    isFormattedNode,
} from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/addresses';
import { isSignerRole } from '@solana/instructions';
import {
    getLastNodeFromPath,
    getTextNodeContent,
    type InstructionAccountDisplayNode,
    type LinkableDictionary,
    titleCase,
} from 'codama';

import { getAccountAddress } from './accounts';
import type { DisplayField } from './types';

/**
 * The rows of the fallback list of an instruction: its data fields, then its accounts, then its
 * remaining accounts. Members skipped `always` are left out. Members skipped `whenInjected` are
 * shown, as the display does not yet know which values were surfaced through injections.
 */
export function getDisplayFields(
    formatted: FormattedInstructionNode,
    parsed: ParsedInstruction,
    linkables: LinkableDictionary,
    options: Pick<FormatOptions, 'formatAddress'>,
): DisplayField[] {
    const formatAddress = (address: Address) => (options.formatAddress ? options.formatAddress(address) : address);
    return [
        ...getDataFields(formatted.data, linkables),
        ...getAccountFields(parsed, formatAddress),
        ...getRemainingAccountFields(parsed, formatAddress),
    ];
}

/** The rows of the instruction data: one per field of a struct, or a single row otherwise. */
function getDataFields(data: FormattedTypeNode | undefined, linkables: LinkableDictionary): DisplayField[] {
    if (!data) return [];
    if (isFormattedNode(data, 'structTypeNode')) return getStructFields(data.fields, '', linkables);
    return [{ label: 'Data', value: getRowText(data.text) }];
}

/**
 * The rows of struct fields. A field matching one of its value labels shows the label, flattened
 * fields are replaced by their own fields, with their prefix, lists of addresses show one row
 * per address, so each one can be verified, and empty values show as `Empty`.
 */
function getStructFields(
    fields: readonly FormattedStructFieldTypeNode[],
    prefix: string,
    linkables: LinkableDictionary,
): DisplayField[] {
    return fields.flatMap(field => {
        if (field.skip === 'always') return [];
        const label = prefix + field.label;
        const valueLabel = getValueLabel(field, linkables);
        if (valueLabel !== undefined) return [{ label, value: valueLabel }];
        if (field.flatten && isFormattedNode(field.type, 'structTypeNode')) {
            return getStructFields(field.type.fields, prefix + field.flattenPrefix, linkables);
        }
        const addresses = getAddressItems(field.type);
        if (addresses && addresses.length > 0) {
            return addresses.map((address, index) => ({
                label: addresses.length > 1 ? `${label} #${index + 1}` : label,
                value: address.text,
            }));
        }
        return [{ label, value: getRowText(field.text) }];
    });
}

/**
 * The text of a row, where empty values, e.g. an empty list or string, show as `Empty` rather
 * than as a blank that could read as a rendering error.
 */
function getRowText(text: string): string {
    return text === '' ? 'Empty' : text;
}

/** The items of a list of addresses, within an option or not, if the type is one. */
function getAddressItems(type: FormattedTypeNode): readonly FormattedTypeNode[] | undefined {
    if (isFormattedNode(type, ['optionTypeNode', 'remainderOptionTypeNode', 'zeroableOptionTypeNode'])) {
        return type.item ? getAddressItems(type.item) : undefined;
    }
    if (!isFormattedNode(type, ['arrayTypeNode', 'setTypeNode'])) return undefined;
    // Links are transparent in decoded nodes, so items linking to a public key are public keys too.
    return type.items.every(item => isFormattedNode(item, 'publicKeyTypeNode')) ? type.items : undefined;
}

/** The rows of the named accounts of the instruction, leaving out optional accounts that are omitted. */
function getAccountFields(parsed: ParsedInstruction, formatAddress: (address: Address) => string): DisplayField[] {
    const instruction = getLastNodeFromPath(parsed.path);
    return (instruction.accounts ?? []).flatMap(account => {
        if (account.display?.skip === 'always') return [];
        const address = getAccountAddress(parsed, account.identifier);
        if (address === undefined) return [];
        return [{ label: getLabel(account.display, account.identifier), value: formatAddress(address) }];
    });
}

/**
 * The rows of the remaining accounts of the instruction. The parsed instruction holds them as a
 * single list, so each group but the last takes the run of accounts whose signer role matches its
 * `isSigner`, and the last group takes the rest. A group with an `isSigner` of `either` therefore
 * takes every account after it when it is not the last. Groups with several accounts number them.
 * When the IDL declares no groups, remaining accounts are still shown, as `Remaining Account`,
 * since the signer passes them.
 */
function getRemainingAccountFields(
    parsed: ParsedInstruction,
    formatAddress: (address: Address) => string,
): DisplayField[] {
    const groups = getLastNodeFromPath(parsed.path).remainingAccounts ?? [];
    const metas = parsed.remainingAccounts;
    let cursor = 0;
    const groupFields = groups.flatMap((group, groupIndex) => {
        const isLastGroup = groupIndex === groups.length - 1;
        const taken: Address[] = [];
        while (
            cursor < metas.length &&
            (isLastGroup || signerMatches(group.isSigner, isSignerRole(metas[cursor].role)))
        ) {
            taken.push(metas[cursor].address);
            cursor += 1;
        }
        if (group.display?.skip === 'always') return [];
        return getNumberedFields(getLabel(group.display, group.identifier), taken, formatAddress);
    });
    const leftovers = metas.slice(cursor).map(meta => meta.address);
    return [...groupFields, ...getNumberedFields('Remaining Account', leftovers, formatAddress)];
}

/** One row per address, numbered when there are several. */
function getNumberedFields(
    label: string,
    addresses: readonly Address[],
    formatAddress: (address: Address) => string,
): DisplayField[] {
    return addresses.map((address, index) => ({
        label: addresses.length > 1 ? `${label} #${index + 1}` : label,
        value: formatAddress(address),
    }));
}

function signerMatches(isSigner: boolean | 'either' | undefined, signs: boolean): boolean {
    return isSigner === 'either' || (isSigner ?? false) === signs;
}

/** The label of an account or a group of remaining accounts, from its display node or its identifier in title case. */
function getLabel(display: InstructionAccountDisplayNode | undefined, identifier: string): string {
    return display?.label === undefined ? titleCase(identifier) : getTextNodeContent(display.label);
}
